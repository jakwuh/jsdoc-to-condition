# jsdoc-to-condition [![Build Status][1]][2]
                     
 [1]: https://travis-ci.org/jakwuh/jsdoc-to-condition.svg?branch=master
 [2]: https://travis-ci.org/jakwuh/jsdoc-to-condition

> Creates validation code from jsdoc comments

### Example

```js
/**
 * @param {[string, number?]} a
 * @param {Object.<string, number>} b
 * @param {string|number} c
 */

// generates the following:

((Array.isArray(a) && (typeof a[0] === 'string') && ((a[1] == null) || (typeof a[1] === 'number')))) &&
(((!!b && (typeof b === 'object') && !Array.isArray(b)) && Object.keys(b).every(function(k){return ((typeof k === 'string') && (typeof b[k] === 'number'));}))) &&
(((typeof c === 'string') || (typeof c === 'number')))
```

### Usage

```bash
yarn add jsdoc-to-condition --dev
```

```js
import {parseType} from 'jsdoc-to-condition';

console.log(parseType(`{string} varName`)[0].validation);
// ((typeof varName === 'string'))
```

### Docs

For full reference on supported comment types see the `tests` folder.

### License

**MIT**
