import { len, hasOwnProperty, escapeChars } from './utils.js';
import { _Object, _Object_prototype, _Array, _String, _Number, _Boolean, _TypeError } from './globals.js';

/** matches safe literals (ex: " unsafe\nliteral ", "safe literal") */
var safeLiteralRegex = /^\w(?:[ \w]*\w)?$/i;

/** matches non-ascii-visible characters 0x20-0x126 inclusive */
var escapeRegex = /[^ -~'"]/g;
/** map of raw chararacters to the escaped equivelent (eg. '\n' -> 'n') */
var escapes = {};

// populate `escapes` with `escapeChars`
for (var char in escapeChars) {
  if (hasOwnProperty(escapeChars, char)) {
    escapes[escapeChars[char]] = char;
  }
}

/**
 * replacer for `escapeRegex` that escapes non-ascii-visible characters
 * @param {string} char - character to escape
 * @returns escaped character string
 */
function escapeReplacer(char) {
  var escaped = '\\';
  if (hasOwnProperty(escapes, char)) {
    escaped += escapes[char];
  } else {
    var code = char.charCodeAt();
    var codeHex = (code + 65536).toString(16); // add 0x10000 for zero-padding
    var codeUnicode = code > 127;
    escaped += (codeUnicode ? 'u' : 'x') + codeHex.substr(codeUnicode ? -4 : -2);
  }
  return escaped;
}

export function stringify(value, indent) {
  var indentValue = '';
  var indentType = typeof indent;
  if (indentType === 'string') {
    indentValue = indent;
  } else if (indentType === 'number') {
    for (var i = 0; i < indent; i++) {
      indentValue += ' ';
    }
  }

  /**
   * generates a string containing `length` repeating instances of `indentValue` prefixed with a newline
   * @param {number} length - number of instances of the indent
   */
  function indentString(length) {
    if (indentValue) {
      for (var indent = '', i = 0; i < length; i++) {
        indent += indentValue;
      }
      return '\n' + indent;
    }
    return '';
  }

  /** stack of objects being stringified for indentation and cyclic checks */
  var stack = [];

  /**
   * converts a primitive js value to a ckt literal
   * @param value - must be typeof string/number/boolean
   * @returns string or undefined
   */
  function stringifyPrimitive(value) {
    if (typeof value === 'string') {
      if (safeLiteralRegex.test(value)) {
        return value;
      }
      return '"' + value.replace(escapeRegex, escapeReplacer) + '"';
    }
    return '' + value;
  }

  /**
   * converts a pure object to a ckt table
   * @param value - `Object.getPrototypeOf(object)` must be `Object.prototype` or `null`
   * @returns string or undefined
   */
  function stringifyPureObject(object) {
    if (stack.indexOf(object) >= 0) {
      throw new _TypeError('ckt: cyclic reference');
    }
    stack.push(object);

    // elements are the numerically-indexed fields
    var elements = [], length = 0;
    // properties are the key-value fields
    var properties = [];

    // equals sign to use between key and value for property fields (no spaces when not prettyprinting)
    var equals = indentValue ? ' = ' : '=';

    // iterate over object's own properties
    for (var key in object) {
      if (typeof key === 'string' && hasOwnProperty(object, key)) {
        var valueString = stringifyValue(object[key]);
        if (valueString == null) continue;
        if (key === length + '') {
          elements.push(valueString);
          length++;
        } else {
          properties.push(stringifyPrimitive(key) + equals + valueString);
        }
      }
    }

    stack.pop();
    var level = len(stack);

    var indent = indentString(level);
    var separator = indentValue ? indent : ',';

    var bodyElements = elements.join(separator);
    var bodyProperties = properties.join(separator);
    var body = (
      bodyElements
      + (bodyElements && bodyProperties ? separator : '')
      + bodyProperties
    );
    if (level) {
      return (
        '['
        + indent
        + body
        + (indentValue ? indentString(level - 1) : '')
        + ']'
      );
    }
    return body;
  }

  /**
   * converts a typeof object to a ckt string
   * @param object - must be `typeof object === 'object' && object !== null`
   * @returns string or undefined
   */
  function stringifyObject(object) {
    var objectPrototype = _Object.getPrototypeOf(object);
    if (
      objectPrototype === null ||
      objectPrototype === _Object_prototype ||
      _Array.isArray(object)
    ) {
      return stringifyPureObject(object);
    }
    if (typeof object.toJSON === 'function') {
      return stringifyValue(object.toJSON());
    }
    if (
      object instanceof _String ||
      object instanceof _Number ||
      object instanceof _Boolean
    ) {
      return stringifyValue(object.valueOf());
    }
  }

  /**
   * converts a value to a ckt string
   * @param value - value to stringify
   * @returns string or undefined
   */
  function stringifyValue(value) {
    if (value === null) {
      return 'null';
    } else if (typeof value === 'object') {
      return stringifyObject(value);
    } else if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return stringifyPrimitive(value);
    }
  }

  var valueString = stringifyValue(value);
  return valueString == null ? '' : valueString;
}
