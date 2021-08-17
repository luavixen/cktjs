import {
  _Object,
  _Object_prototype_hasOwnProperty,
  _Array,
  _String,
  _SyntaxError,
  _parseInt
} from './global.js';

/*
var EOF = 0
  , NEWLINE = 1
  , SEPARATOR = 2
  , OPERATOR = 3
  , LITERAL = 4
  , STRING = 5
  , MULTILINE = 6;
*/

var escapeRegex = /\\(?:(?:u([0-9a-f]{4}))|(?:x([0-9a-f]{2}))|(.))/gi;
var escapeChars = {
  0: '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  f: '\f',
  b: '\b'
};

var tkRegex = /([ \t\r]+)|(\n|#.*(?:\n|$))|([;,]+)|([=\[\]])|((?:[^\n;,"|=\[\]#\\]|\\.)*(?:[^ \t\r\n;,"|=\[\]#\\]|\\.))|("(?:\\"|.)*?")|((?:[ \t\r]*\|.*\n)+)/g;
var multilineSplitRegex = /(?:^|\n)[ \t\r]*\|?/g;

var valueKeywords = {null: null, false: false, true: true};
var valueNumberRegex = /^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i;
function valueInterpret(text) {
  if (_Object_prototype_hasOwnProperty.call(valueKeywords, text)) {
    return valueKeywords[text];
  }
  if (valueNumberRegex.test(text)) {
    return text * 1;
  }
  return text;
}

var tkTypeNames = ['EOF', 0, ',', 0, 'value'];
function tkName(type, val) {
  if (type == /*OPERATOR*/3) {
    return val;
  }
  return tkTypeNames[type];
}

export function parse(script) {
  var line = 1, column = 1;
  function error(message) {
    return new _SyntaxError(
      'ckt '
      + line
      + ':'
      + (column - (tkVal ? tkVal.length : 0))
      + ' '
      + message
    );
  }

  function unescape(_, hex1, hex2, char) {
    var hex = hex1 || hex2;
    if (hex) {
      return _String.fromCharCode(_parseInt(hex, 16));
    }
    if (char == 'u' || char == 'x') {
      throw error('incomplete hex escape');
    }
    return escapeChars[char] || char;
  }

  var tkType, tkVal;
  function tkNext() {
    var result, text, type, length;
    while (
      (result = tkRegex.exec(script)) &&
      (length = result[0].length, text = result[1])
    ) {
      column += length;
    }
    if (result) {
      for (
        text = result[0], type = 1;
        type < 8 && result[type + 1] == null;
        type++
      ) {}
      if (type == /*NEWLINE*/1) {
        line++;
        column = 1;
      } else {
        column += length;
      }
      if (type == /*STRING*/5) {
        text = text.slice(1, length - 1);
      } else if (type == /*MULTILINE*/6) {
        var lines = text.split(multilineSplitRegex);
        var linesLength = lines.length;
        lines = lines.slice(1, linesLength - 1);
        line += linesLength;
        column = 1;
        type = /*STRING*/5;
        text = lines.join('\n');
      }
      tkType = type;
      tkVal = text;
    } else {
      tkType = /*EOF*/0;
      tkVal = '';
    }
  }
  tkNext();

  var matchVal;
  function match(type, text) {
    if (
      (tkType == type || (tkType == /*NEWLINE*/1 && type == /*SEPARATOR*/2)) &&
      (!text || tkVal == text)
    ) {
      matchVal = tkVal;
      if (tkType != /*EOF*/0) {
        tkNext();
      }
      return matchVal;
    }
    return null;
  }

  function expect(type, text) {
    if (match(type, text) == null) {
      throw error(
        'expected '
        + tkName(type, text)
        + ' but found '
        + tkName(tkType, tkVal)
      );
    }
    return matchVal;
  }

  function slurp(separators) {
    for (
      var matched = false;
      match(/*NEWLINE*/1) || (separators && match(/*SEPARATOR*/2));
      matched = true
    ) {}
    return matched;
  }

  var parseValueType;
  function parseValue(expected) {
    var literal = match(/*LITERAL*/4), string = match(/*STRING*/5);
    if (literal || string != null) {
      parseValueType = literal ? 0 : 1;
      return matchVal.replace(escapeRegex, unescape);
    } else if (tkType == /*OPERATOR*/3 && tkVal == '[') {
      parseValueType = 2;
      return parseObject(false);
    }
    return expected ? expect(/*LITERAL*/4) : null;
  }

  function parseObject(root) {
    var map = _Object.create(null), length = 0;
    if (!root) {
      expect(/*OPERATOR*/3, '[');
    }
    slurp(true);
    for (;;) {
      var left = parseValue(), right;
      if (left == null) {
        if (root ? match(/*EOF*/0) != null : match(/*OPERATOR*/3, ']')) {
          break;
        } else {
          expect(/*LITERAL*/4);
        }
      }
      slurp();
      if (parseValueType < 2) {
        if (match(/*OPERATOR*/3, '=')) {
          slurp();
          right = parseValue(true);
          if (left != '__proto__') {
            map[left] = parseValueType ? right : valueInterpret(right);
            if (left === length + '') {
              length++;
            }
          }
        } else {
          map[length++] = parseValueType ? left : valueInterpret(left);
        }
      } else {
        map[length++] = left;
      }
      slurp(true);
    }
    var arr = _Array(length);
    for (var key in map) {
      if (_Object_prototype_hasOwnProperty.call(map, key)) {
        arr[key] = map[key];
      }
    }
    return arr;
  }

  return parseObject(true);
}
