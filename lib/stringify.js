import { len, hasOwnProperty } from './utils.js';
import { _Object, _Object_prototype, _Array, _String, _Number, _Boolean, _TypeError } from './globals.js';

/** Matches safe literals (eg. " unsafe\nliteral ", "safe literal") */
var safeLiteralRegex = /^\w(?:[ \w]*\w)?$/;

/** Matches unsafe characters (single/double quotes, not within 0x20-0x126) */
var escapeRegex = /[^ -~'"]/g;
/** Map of raw chararacters to their escapes */
var escapeChars = {
  '\n': 'n',
  '\r': 'r',
  '\t': 't',
  '"': '"'
};

/**
 * Replacer for `escapeRegex` that escapes unsafe characters
 * @param {string} char - Character to escape
 * @returns {string} Escaped character string
 */
function escapeReplacer(char) {
  var escaped = '\\';
  if (hasOwnProperty(escapeChars, char)) {
    escaped += escapeChars[char];
  } else {
    var code = char.charCodeAt();
    var codeHex = (code + 65536).toString(16); // Add 0x10000 for zero-padding
    var codeUnicode = code > 126;
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
   * Generates a string containing `length` repeating instances of `indent` prefixed with a newline
   * @param {number} length - Number of instances of the indent
   * @returns {string} Newline + indent string
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

  /**
   * Stringifies a primitive JS value to a CKT literal/string
   * @param {boolean|number|string} value - Value to stringify
   * @returns {string|undefined}
   */
  function stringifyPrimitive(value) {
    if (typeof value === 'number' && (value !== value || value === Infinity || value === -Infinity)) {
      return 'null';
    }
    if (typeof value !== 'string') {
      value = '' + value;
    }
    if (safeLiteralRegex.test(value)) {
      return value;
    }
    return '"' + value.replace(escapeRegex, escapeReplacer) + '"';
  }

  /** Stack of objects being stringified, used for indentation and cyclic reference checks */
  var stack = [];

  /**
   * Stringifies a pure object to a CKT table
   * @param {object} object - Object to stringify
   * @returns {string|undefined}
   */
  function stringifyPureObject(object) {
    if (stack.indexOf(object) >= 0) {
      throw new _TypeError('CKT: cyclic reference');
    }
    stack.push(object);

    // `elements` contains the numerically indexed elements which will come first
    var elements = [], index = 0;
    // `properties` contains the key-value properties which come after the elements
    var properties = [];

    // String to insert between keys and values, no spaces when not pretty-printing
    var equals = indentValue ? ' = ' : '=';

    // Iterate over object's own properties (not including symbols)
    for (var key in object) {
      if (typeof key === 'string' && hasOwnProperty(object, key)) {
        // Stringify the object value
        var valueString = stringifyValue(object[key]);
        if (valueString == null) continue;
        // Write it into elements or properties
        if (key === index + '') {
          elements.push(valueString);
          index++;
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
    var body = bodyElements + (bodyElements && bodyProperties ? separator : '') + bodyProperties;

    if (level) {
      return '[' + indent + body + (indentValue ? indentString(level - 1) : '') + ']';
    }
    return body;
  }

  /**
   * Stringifies a typeof object to a CKT string
   * @param {object} object - Object to stringify
   * @returns {string|undefined}
   */
  function stringifyObject(object) {
    if (typeof object.toJSON === 'function') {
      return stringifyValue(object.toJSON());
    }
    var objectPrototype = _Object.getPrototypeOf(object);
    if (objectPrototype === null || objectPrototype === _Object_prototype || _Array.isArray(object)) {
      return stringifyPureObject(object);
    }
    if (object instanceof _String || object instanceof _Number || object instanceof _Boolean) {
      return stringifyValue(object.valueOf());
    }
  }

  /**
   * Stringifies a value to a CKT string
   * @param {*} value - Value to stringify
   * @returns {string|undefined}
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
