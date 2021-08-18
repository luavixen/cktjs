import { _Object_prototype } from './globals.js';

/**
 * Gets the length of an array, string, or similar
 * @param {{length: number}} value - Object with a `length` property
 * @returns {number} Value of the `length` property
 */
export function len(value) {
  return value.length;
}

/**
 * Safely checks if an object has a property
 * @param {*} object
 * @param {*} property
 * @returns {boolean}
 */
export function hasOwnProperty(object, property) {
  return property !== '__proto__' && _Object_prototype.hasOwnProperty.call(object, property);
}
