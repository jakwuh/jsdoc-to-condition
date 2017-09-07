import doctrine from 'doctrine';
import {h, t, generateValidation} from './validations';

let doctrineOptions = {
    unwrap: false,
    sloppy: true,
    recoverable: true,
    tags: ['param']
};

export function parseType(text, options) {
    let comment = `@param ${text}`;

    return parseComment(comment, options);
}

export function parseComment(text, options = {}) {
    let parseOptions = {
        ...doctrineOptions,
        ...options
    };

    let {tags} = doctrine.parse(text, parseOptions);

    return tags.map(tag => {
        let validation = generateValidation(tag.name, tag.type);

        return {
            h,
            t,
            tag,
            validation
        }
    }).filter(Boolean);
}
