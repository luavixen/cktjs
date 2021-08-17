import { _Object_prototype } from './globals.js';

export function len(value) {
  return value.length;
}

export function hasOwnProperty(object, property) {
  return _Object_prototype.hasOwnProperty.call(object, property);
}

export var staticLiterals = { null: null, true: true, false: false };

export var unescapeRegex = /\\(?:(?:u([0-9a-fA-F]{4}))|(?:x([0-9a-fA-F]{2}))|(.))/g;
export var unescapes = {
  0: '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  f: '\f',
  b: '\b'
};

export var escapeRegex = /[^ -~'"]/g;
export var escapes = {};

for (var char in unescapes) {
  if (hasOwnProperty(unescapes, char)) {
    escapes[unescapes[char]] = char;
  }
}
