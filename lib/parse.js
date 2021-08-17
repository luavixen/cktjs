import { len, hasOwnProperty, staticLiterals, unescapeRegex, unescapes } from './utils.js';
import { _Object, _String, _SyntaxError, _parseInt } from './globals.js';

/*
var EOF = 0
  , NEWLINE = 1
  , SEPARATOR = 2
  , OPERATOR = 3
  , LITERAL = 4
  , STRING = 5
  , MULTILINE = 6;
*/

var multilineSplitRegex = /(?:^|\n)[ \t\v\f\r]*\|?/g;
var literalNumberRegex = /^[+-]?\d+(?:\.\d+)?(?:e[+-]?\d+)?/i;

function parseLiteral(text) {
  if (hasOwnProperty(staticLiterals, text)) {
    return staticLiterals[text];
  }
  if (literalNumberRegex.test(text)) {
    return text * 1;
  }
  return text;
}

var tkNames = ['EOF', 0, ',', 0, 'value'];
function tkName(type, val) {
  if (type == /*OPERATOR*/3) {
    return val;
  }
  return tkNames[type];
}

export function parse(script) {
  script += '';

  var line = 1, column = 1;
  function error(message) {
    return new _SyntaxError(
      'ckt '
      + line
      + ':'
      + (column - (tkVal ? len(tkVal) : 0))
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
    if (hasOwnProperty(unescapes, char)) {
      return unescapes[char];
    }
    return char;
  }

  var tkType, tkVal;
  var tkRegex = /([ \t\v\f\r]+)|(\n|#.*(?:\n|$))|([;,]+)|([=\[\]])|((?:[^\n;,"|=\[\]#\\]|\\.)*(?:[^ \t\v\f\r\n;,"|=\[\]#\\]|\\.))|("(?:\\"|.)*?")|((?:[ \t\v\f\r]*\|.*\n)+)/g;
  function tkNext() {
    var result, text, type, length;
    while (
      (result = tkRegex.exec(script)) &&
      (length = len(result[0]), text = result[1])
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
        var linesLength = len(lines);
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

  function match(type, text) {
    if (
      (tkType == type || (tkType == /*NEWLINE*/1 && type == /*SEPARATOR*/2)) &&
      (!text || tkVal == text)
    ) {
      var matched = tkVal;
      if (tkType != /*EOF*/0) {
        tkNext();
      }
      return matched;
    }
    return null;
  }

  function expect(type, text) {
    var matched = match(type, text);
    if (matched == null) {
      throw error(
        'expected '
        + tkName(type, text)
        + ' but found '
        + tkName(tkType, tkVal)
      );
    }
    return matched;
  }

  function slurp(separators) {
    for (
      var slurped = false;
      match(/*NEWLINE*/1) || (separators && match(/*SEPARATOR*/2));
      slurped = true
    ) {}
    return slurped;
  }

  var parseValueType;
  function parseValue(expected) {
    var literal = match(/*LITERAL*/4), string = match(/*STRING*/5);
    var matched = literal || string;
    if (matched != null) {
      parseValueType = literal ? 0 : 1;
      return matched.replace(unescapeRegex, unescape);
    } else if (tkType == /*OPERATOR*/3 && tkVal == '[') {
      parseValueType = 2;
      return parseTable(false);
    }
    return expected ? expect(/*LITERAL*/4) : null;
  }

  function parseTable(root) {
    var table = [];
    if (!root) {
      expect(/*OPERATOR*/3, '[');
    }
    slurp(true);
    for (;;) {
      var left = parseValue(), value;
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
          value = parseLiteral(parseValue(true));
          if (left in table) {
            _Object.defineProperty(table, left, {
              value: value,
              writable: true,
              enumerable: true,
              configurable: true
            });
          } else {
            table[left] = value;
          }
        } else {
          table.push(parseValueType ? left : parseLiteral(left));
        }
      } else {
        table.push(left);
      }
      slurp(true);
    }
    return table;
  }

  return parseTable(true);
}
