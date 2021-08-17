import { len, hasOwnProperty, escapes, escapeRegex } from './utils.js';
import { _Object, _Object_prototype, _Array, _String, _Number, _Boolean, _TypeError } from './globals.js';

var safeLiteralRegex = /^\w([ \w]*\w)?$/i;

function escapeReplacer(char) {
  var escaped = '\\';
  if (hasOwnProperty(escapes, char)) {
    escaped += escapes[char];
  } else {
    var code = char.charCodeAt();
    var codeHex = (code + 65536).toString(16);
    var codeUnicode = code > 127;
    escaped += (
      (codeUnicode ? 'u' : 'x') + codeHex.substr(codeUnicode ? -4 : -2)
    );
  }
  return escaped;
}

export function stringify(value, indent) {
  var stack = [];

  var indentType = typeof indent;
  var indentValue = '';
  if (indentType == 'string') {
    indentValue = indent;
  } else if (indentType == 'number') {
    for (var i = 0; i < indent; i++) {
      indentValue += ' ';
    }
  }
  function indentString(length) {
    if (indentValue) {
      for (var indent = '', i = 0; i < length; i++) {
        indent += indentValue;
      }
      return '\n' + indent;
    }
    return '';
  }

  function stringifyLiteral(value) {
    if (typeof value == 'string') {
      if (safeLiteralRegex.test(value)) {
        return value;
      }
      return '"' + value.replace(escapeRegex, escapeReplacer) + '"';
    }
    return (value == null ? null : value) + '';
  }

  function stringifyTable(table) {
    if (stack.indexOf(table) >= 0) {
      throw new _TypeError('ckt: cyclic reference');
    }
    stack.push(table);

    var elements = [], length = 0;
    var properties = [];

    var equals = indentValue ? ' = ' : '=';

    for (var key in table) {
      if (hasOwnProperty(table, key)) {
        var valueString = stringify(table[key]);
        if (key === length + '') {
          elements.push(valueString);
          length++;
        } else {
          properties.push(stringifyLiteral(key) + equals + valueString);
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

  function stringifyObject(object) {
    var objectPrototype = _Object.getPrototypeOf(object);
    if (
      objectPrototype == null ||
      objectPrototype == _Object_prototype ||
      _Array.isArray(object)
    ) {
      return stringifyTable(object);
    }
    if (typeof object.toJSON == 'function') {
      return stringify(object.toJSON());
    }
    if (
      object instanceof _String ||
      object instanceof _Number ||
      object instanceof _Boolean
    ) {
      return stringify(object.valueOf());
    }
    return 'null';
  }

  function stringify(value) {
    var valueType = typeof value;
    if (valueType == 'object' && value != null || valueType == 'function') {
      return stringifyObject(value);
    }
    return stringifyLiteral(value);
  }

  return stringify(value);
}
