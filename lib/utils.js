import { _Object_prototype } from './globals.js';

export function len(value) {
  return value.length;
}

export function hasOwnProperty(object, property) {
  return property !== '__proto__' && _Object_prototype.hasOwnProperty.call(object, property);
}

export var escapeChars = {
  0: '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  f: '\f',
  b: '\b'
};
