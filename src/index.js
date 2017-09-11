import doctrine from 'doctrine';
import {h, t, generateValidation} from './validations';

export function parseType(text, options) {
    let comment = `@param ${text}`;

    return parseComment(comment, options);
}

export function parseComment(text, {
    unwrap = false,
    sloppy = true,
    recoverable = true,
    tags = ['param'],
    bindings = {}
} = {}) {
    let parseOptions = {
        unwrap,
        sloppy,
        recoverable,
        tags
    };

    let parsed = doctrine.parse(text, parseOptions);

    return parsed.tags.map(tag => {
        let basename = tag.name.split('.')[0],
            rest = tag.name.slice(basename.length);

        if (basename in bindings) {
            tag.binding = bindings[basename] + rest;
        } else {
            tag.binding = tag.name;
        }

        let validation = generateValidation(tag.binding, tag.type);

        if (validation) {
            return {
                h,
                t,
                tag,
                validation
            }
        }
    }).filter(Boolean);
}
