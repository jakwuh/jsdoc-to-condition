import {parseType} from '../lib/index';
import test from 'ava';

function mockFunction() {
}

function mockClass() {
}

class Bar {
}

class Foo {
}

let obj = {};

let suite = [
    {type: '{*}', valid: [null, undefined, 0, false, 2, {}, [1]], invalid: []},
    {type: '{?}', valid: [null, undefined, 0, false, 2, {}, [1]], invalid: []},
    {type: '{null}', valid: [null], invalid: [undefined, 0, {}, [1]]},
    {type: '{undefined}', valid: [undefined], invalid: [null, 0, false, {}, [1]]},
    {type: '{function(!string, ?number=)}', valid: [mockFunction, mockClass], invalid: [{}, [2], false, undefined]},
    {
        type: '{function(!string, number=): boolean}',
        valid: [mockFunction, mockClass],
        invalid: [{}, [2], false, undefined]
    },
    {type: '{Function}', valid: [mockFunction, mockClass], invalid: [{}, [2], false, undefined]},
    {type: '{string}', valid: ['a'], invalid: [new String('a'), 2, {}, undefined]},
    {type: '{String}', valid: ['a'], invalid: [new String('a'), 2, {}, undefined]},
    {type: '{Bar}', valid: [new Bar], invalid: [Bar, Foo, new Foo, {}, mockFunction, undefined, null]},
    {type: '{BarFoo}', valid: [new Bar, Bar, Foo, new Foo, {}, mockFunction, undefined, null], invalid: []},
    {type: '{obj}', valid: [new Bar, Bar, Foo, new Foo, {}, mockFunction, undefined, null], invalid: []},
    {type: '{string=}', valid: [undefined, '2'], invalid: [new String('a'), 2, {}]},
    {type: '{?string}', valid: [undefined, null, 's'], invalid: [new String('a'), 2, {}]},
    {type: '{!string}', valid: ['s'], invalid: [undefined, null, new String('a'), 2, {}]},
    {type: '{{a: string, b}}', valid: [{a: '2', b: 2}, {a: '2', b: {}}], invalid: [{a: '2'}, {a: false, b: 2}]},
    {type: '{...string}', valid: [['s', '2'], []], invalid: ['s', ['s', 2]]},
    {type: '{string|number}', valid: [2, 's'], invalid: [new String('a'), {}, undefined, Foo, new Foo()]},
    {type: '{[string, number]}', valid: [['2', 2]], invalid: [[2, 's'], 2, 's', [], ['s']]},
    {type: '{[string, number?]}', valid: [['2', 2], ['2']], invalid: [[2, 's'], 2, 's', []]},
    {type: '{Array.<string | number>}', valid: [['2', 2, '2', 3]], invalid: [[2, 's', undefined]]},
    {type: '{string[]}', valid: [['s', '2'], []], invalid: [[2, 's'], 's', null, undefined]},
    {type: '{Object.<string, number>}', valid: [{'2': 2}, {}], invalid: [{'s': 's'}, [], undefined, null]},
    {
        type: '{{results: object[], count: number, next: *, previous: *}}',
        valid: [{results: [{}, {}], count: 2, next: 0, previous: null}],
        invalid: [
            {results: {}, count: 2, next: 0, previous: null},
            {results: [{}, {}], count: false, next: 0, previous: null},
            {results: [{}, {}], count: 2, next: 0},
            {count: 2, next: 0, previous: null}
        ]
    },
    {type: '{*=}', valid: [null, undefined, false, []], invalid: []},
    {type: '{*?=}', valid: [null, undefined, false, []], invalid: []},
    {type: '{?=}', valid: [null, undefined, false, []], invalid: []},
    {type: '{null=}', valid: [null, undefined], invalid: [0, false, [], {}]}
];

let doctrineOptions = {
    sloppy: true,
    recoverable: true,
    tags: ['param']
};

for (let suiteCase of suite) {
    let {type, valid, invalid} = suiteCase;

    let doc = `${type} value`;

    test(doc, t => {
        let item = parseType(doc)[0];

        if (!item) {
            t.is(invalid.length, 0);
        } else {
            valid.forEach(function (value) {
                t.true(eval(item.validation));
            });
            invalid.forEach(function (value) {
                t.false(eval(item.validation));
            });
        }
    });
}

test('bindings', t => {
    let item = parseType(`{string} method`, {bindings: {'method': '_method'}})[0];
    t.is(item.validation, '(typeof _method === \'string\')');
});

test('bindings 2', t => {
    let item = parseType(`{string} deps.str`, {bindings: {'deps': '_deps'}})[0];
    t.is(item.validation, '(typeof _deps.str === \'string\')');
});
