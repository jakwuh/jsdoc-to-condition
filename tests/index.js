import {typeToValidation} from '../lib/index';
import test from 'ava';

function mockFunction() {
}

function mockClass() {

}

class Bar {

}

class Foo {

}

let suite = [
    {type: '{*}', valid: [null, undefined, 0, false, 2, {}, [1]], invalid: []},
    {type: '{?}', valid: [null, undefined, 0, false, 2, {}, [1]], invalid: []},
    {type: '{null}', valid: [null], invalid: [undefined, 0, {}, [1]]},
    {type: '{undefined}', valid: [undefined], invalid: [null, 0, false, {}, [1]]},
    {type: '{function(!string, ?number=)}', valid: [mockFunction, mockClass], invalid: [{}, [2], false, undefined]},
    {type: '{function(!string, number=): boolean}', valid: [mockFunction, mockClass], invalid: [{}, [2], false, undefined]},
    {type: '{Function}', valid: [mockFunction, mockClass], invalid: [{}, [2], false, undefined]},
    {type: '{string}', valid: ['a'], invalid: [new String('a'), 2, {}, undefined]},
    {type: '{String}', valid: ['a'], invalid: [new String('a'), 2, {}, undefined]},
    {type: '{Bar}', valid: [new Bar], invalid: [Bar, Foo, new Foo, {}, mockFunction, undefined, null]},
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
    {type: '{Object.<string, number>}', valid: [{'2': 2}, {}], invalid: [{'s': 's'}, [], undefined, null]}
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
        let validation = typeToValidation(doc);

        if (!validation) {
            t.is(invalid.length, 0);
        } else {
            for (let value of valid) {
                t.true(eval(validation));
            }
            for (let value of invalid) {
                t.false(eval(validation));
            }
        }
    });
}
