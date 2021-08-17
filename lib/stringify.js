import {
  _Object,
  _Object_prototype,
  _Object_prototype_hasOwnProperty,
  _Array,
  _String,
  _Number,
  _Boolean,
  _TypeError,
  _JSON
} from './global.js';

var safeLiteralRegex = /^\w+$/i;

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

  var indentEnabled = !!indentValue;
  function indentString(length) {
    if (indentEnabled) {
      for (var indent = '', i = 0; i < length; i++) {
        indent += indentValue;
      }
      return '\n' + indent;
    }
    return '';
  }

  function stringifyLiteral(value) {
    if (safeLiteralRegex.test(value)) {
      return value;
    }
    return _JSON.stringify(value) || 'null';
  }

  function stringifyTable(table) {
    if (stack.indexOf(table) >= 0) {
      throw new _TypeError('ckt: cyclic reference');
    }
    stack.push(table);

    var elements = [], length = 0;
    var properties = [];

    var equals = indentEnabled ? ' = ' : '=';

    for (var key in table) {
      if (!_Object_prototype_hasOwnProperty.call(table, key)) continue;

      var valueString = stringify(table[key]);
      if (key === length + '') {
        elements.push(valueString);
        length++;
      } else {
        properties.push(stringifyLiteral(key) + equals + valueString);
      }
    }

    stack.pop();
    var level = stack.length;

    var indent = indentString(level);
    var separator = indentEnabled ? indent : ',';

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
        + (indentEnabled ? indentString(level - 1) : '')
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
