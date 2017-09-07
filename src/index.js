import doctrine from 'doctrine';
import {tagsToValidation} from './validations';

let doctrineOptions = {
    unwrap: false,
    sloppy: true,
    recoverable: true,
    tags: ['param']
};

export function typeToValidation(text, options = {}) {
    let comment = `@param ${text}`;

    return commentToValidation(comment, options);
}

export function commentToValidation(text, options = {}) {
    let parseOptions = {
        ...doctrineOptions,
        ...options
    };

    let {tags} = doctrine.parse(text, parseOptions);

    return tagsToValidation(tags);
}
