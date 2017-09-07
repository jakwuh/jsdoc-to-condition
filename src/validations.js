let h = {
    and(...exprs) {
        return `(${exprs.join(' && ')})`;
    },
    or(...exprs) {
        return `(${exprs.join(' || ')})`;
    },
    not(expr) {
        return '!' + expr;
    },
    true() {
        return 'true';
    },
    isArray(name) {
        return `Array.isArray(${name})`;
    },
    isObject(name) {
        return `(!!${name} && ${h.typeOf(name, 'object')} && !${h.isArray(name)})`;
    },
    typeOf(expr, type) {
        return `(typeof ${expr} === '${type}')`;
    },
    instanceOf(name, constructor) {
        return `(${name} instanceof ${constructor})`;
    },
    hasOwnProperty(object, prop) {
        return `Object.prototype.hasOwnProperty.call(${object}, '${prop}')`;
    },
    isNil(name) {
        return `(${name} == null)`;
    },
    isNull(name) {
        return `(${name} === null)`;
    },
    isUndefined(name) {
        return `(${name} === undefined)`;
    },
    every(name, type) {
        return `${name}.every(function(n){return ${generateValidation('n', type)};})`;
    },
    everyKey(name, keyType, valueType) {
        let validation = h.and(generateValidation('k', keyType), generateValidation(name + '[k]', valueType));
        return `Object.keys(${name}).every(function(k){return ${validation};})`;
    },
    at(name, index) {
        return `${name}[${index}]`;
    }
};

let t = {
    isUndefinedLiteral(type) {
        return type.type === 'UndefinedLiteral'
    },
    isNullLiteral(type) {
        return type.type === 'NullLiteral'
    },
    isNullableLiteral(type) {
        return type.type === 'NullableLiteral'
    },
    isAllLiteral(type) {
        return type.type === 'AllLiteral';
    },
    isOptionalType(type) {
        return type.type === 'OptionalType';
    },
    isFunctionType(type) {
        return type.type === 'FunctionType';
    },
    isNameExpression(type) {
        return type.type === 'NameExpression';
    },
    isNonNullableType(type) {
        return type.type === 'NonNullableType';
    },
    isNullableType(type) {
        return type.type === 'NullableType';
    },
    isRecordType(type) {
        return type.type === 'RecordType';
    },
    isRestType(type) {
        return type.type === 'RestType';
    },
    isTypeApplication(type) {
        return type.type === 'TypeApplication';
    },
    isUnionType(type) {
        return type.type === 'UnionType';
    },
    isArrayType(type) {
        return type.type === 'ArrayType';
    }
};

function typeofName(nodeTypeName) {
    let name = nodeTypeName.toLowerCase(),
        types = [
            'object', 'function', 'string', 'number',
            'boolean', 'undefined', 'symbol'
        ];

    return types.includes(name) ? name : undefined;
}

function generateApplicationValidation(name, expression, applications) {
    let applicationType = expression.name.toLowerCase();

    if (applicationType === 'array' && applications.length === 1) {
        return h.and(h.isArray(name), h.every(name, ...applications));
    }

    if (applicationType === 'object' && applications.length === 2) {
        return h.and(h.isObject(name), h.everyKey(name, ...applications));
    }
}

function generateNameValidation(name, typeName) {
    let expectedType = typeofName(typeName);

    if (!expectedType) {
        // do not support {namespace.MyClass}
        if (typeName.includes('.')) {
            return h.true();
        }

        // {array}
        if (typeName === 'array') {
            typeName = 'Array';
        }

        return h.instanceOf(name, typeName);
    } else {
        return h.typeOf(name, expectedType);
    }
}

function generateRecordValidation(name, fields) {
    let fieldsValidations = fields.map(field => {
        let validations = [h.hasOwnProperty(name, field.key)];

        if (field.value) {
            let subName = `${name}.${field.key}`;
            validations.push(generateValidation(subName, field.value))
        }

        return h.and(...validations);
    });

    return h.and(h.isObject(name), ...fieldsValidations);
}

export function generateValidation(name, type) {
    if (!type) {
        return; // most likely parsing error
    }

    // {*}
    if (t.isAllLiteral(type)) {
        return; // nothing to validate
    }

    // {?}
    if (t.isNullableLiteral(type)) {
        return; // nothing to validate
    }

    // {null}
    if (t.isNullLiteral(type)) {
        return h.isNull(name);
    }

    // {undefined}
    if (t.isUndefinedLiteral(type)) {
        return h.isUndefined(name);
    }

    // {function(!string, ?number=)}
    // {function(!string, number=): boolean}
    if (t.isFunctionType(type)) {
        return h.typeOf(name, 'function');
    }

    // {string}
    // {Function}
    // {MyClass}
    if (t.isNameExpression(type)) {
        return generateNameValidation(name, type.name);
    }

    // {string=}
    // {number} [b]
    if (t.isOptionalType(type)) {
        return h.or(h.isUndefined(name), generateValidation(name, type.expression));
    }

    // {?string}
    if (t.isNullableType(type)) {
        return h.or(h.isNil(name), generateValidation(name, type.expression));
    }

    // {!string}
    if (t.isNonNullableType(type)) {
        return h.and(h.not(h.isNil(name)), generateValidation(name, type.expression))
    }

    // {{a: string, b}}
    if (t.isRecordType(type)) {
        return generateRecordValidation(name, type.fields);
    }

    // {...string}
    if (t.isRestType(type)) {
        return h.and(h.isArray(name), h.every(name, type.expression));
    }

    // {string|number}
    if (t.isUnionType(type)) {
        return h.or(...type.elements.map(subType => generateValidation(name, subType)));
    }

    // {[string, number]}
    if (t.isArrayType(type)) {
        return h.and(h.isArray(name), ...type.elements.map((subType, index) => {
            return generateValidation(h.at(name, index), subType);
        }));
    }

    // {Array.<string | number>}
    // {string[]}
    // {Object.<string, number>}
    if (t.isTypeApplication(type)) {
        return generateApplicationValidation(name, type.expression, type.applications);
    }
}

export function tagsToValidation(tags) {
    let validations = [];

    tags.forEach(tag => {
        let validation = generateValidation(tag.name, tag.type);

        if (validation) {
            validations.push(validation);
        }
    });

    if (validations.length) {
        return h.and(...validations);
    }
}
