import { len, hasOwnProperty, escapeChars } from './utils.js';
import { _Object, _Object_prototype, _String, _SyntaxError, _parseInt  } from './globals.js';

/** matches a newline, followed by whitespace, followed by the vertical bar */
var multilineSplitRegex = /(?:^|\n)[ \t\v\f\r]*\|?/g;
/** matches a backslash followed by an escape sequence [, unicode, ascii, char] */
var unescapeRegex = /\\(?:(?:u([0-9a-fA-F]{4}))|(?:x([0-9a-fA-F]{2}))|(.))/g;

/** matches a token [, whitespace, newline, separator, punctuation, literal, string, multiline, invalid] */
var tkRegex = /([ \t\v\f\r]+)|(\n|#.*(?:\n|$))|([;,]+)|([=\[\]])|((?:[^\n;,"|=\[\]#\\]|\\.)*(?:[^ \t\v\f\r\n;,"|=\[\]#\\]|\\.))|("(?:\\"|.)*?")|((?:[ \t\v\f\r]*\|.*\n)+)|(.)/g;

/** map of literal strings to static primitive js values */
var staticLiterals = { null: null, true: true, false: false };

/*
// these are the possible types of tokens which have been inlined
var EOF = 0
  , NEWLINE = 1
  , SEPARATOR = 2
  , OPERATOR = 3
  , LITERAL = 4
  , STRING = 5
  , MULTILINE = 6;
*/

/** names of EOF (0), SEPARATOR (2), LITERAL (4) */
var tkNames = ['EOF', 0, ',', 0, 'value'];
/**
 * returns the name of a token (must be one of EOF, SEPARATOR, OPERATOR, LITERAL)
 * @param {number} type
 * @param {string} val
 */
function tkName(type, val) {
  if (type === /*OPERATOR*/3) {
    return val;
  }
  return tkNames[type];
}

/**
 * parses a ckt literal and attempts to convert it to a number/boolean/null
 * @param {string} text
 */
function parseLiteral(text) {
  // if the input text can be mapped to a static literal
  if (hasOwnProperty(staticLiterals, text)) {
    return staticLiterals[text];
  }
  // else if the input text is not NaN when coherced to a number
  var number = +text;
  if (number === number) {
    return number;
  }
  // else return unchanged input text
  return text;
}

export function parse(script) {
  // stringify script
  script += '';

  var line = 1, column = 1;
  function error(message) {
    return new _SyntaxError('ckt ' + line + ':' + (column - (tkVal ? len(tkVal) : 0)) + ' ' + message);
  }

  /**
   * replacer for `unescapeRegex` that unescapes characters
   */
  function unescapeReplacer(_, hex1, hex2, char) {
    var hex = hex1 || hex2;
    if (hex) {
      return _String.fromCharCode(_parseInt(hex, 16));
    }
    if (char === 'u' || char === 'x') {
      throw error('incomplete hex escape');
    }
    if (hasOwnProperty(escapeChars, char)) {
      return escapeChars[char];
    }
    return char;
  }

  var tkType, tkVal;
  function tkNext() {
    var result, text, type, length;
    // slurp whitespace
    while (
      (result = tkRegex.exec(script)) &&
      (length = len(result[0]), text = result[1])
    ) {
      column += length;
    }
    if (result) {
      if (result[8]) {
        throw error('unexpected character');
      }
      // detect type
      for (
        text = result[0], type = 1;
        type < 8 && result[type + 1] == null;
        type++
      ) {}
      // increment line/column
      if (type === /*NEWLINE*/1) {
        line++;
        column = 1;
      } else {
        column += length;
      }
      // handle string / multiline
      if (type === /*STRING*/5) {
        text = text.slice(1, length - 1);
      } else if (type === /*MULTILINE*/6) {
        var lines = text.split(multilineSplitRegex);
        var linesLength = len(lines);
        lines = lines.slice(1, linesLength - 1);
        line += linesLength;
        column = 1;
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

  /**
   * attempts to match a token
   * @param {number} type
   * @param {string} text
   * @returns the token value, or null if match failed
   */
  function match(type, text) {
    if ((tkType === type || (tkType === /*NEWLINE*/1 && type === /*SEPARATOR*/2)) && (!text || tkVal === text)) {
      var matched = tkVal;
      if (tkType !== /*EOF*/0) {
        tkNext();
      }
      return matched;
    }
    return null;
  }

  /**
   * matches a token
   * @param {number} type
   * @param {string} text
   * @returns the token value
   * @throws {@see SyntaxError} on match failure
   */
  function expect(type, text) {
    var matched = match(type, text);
    if (matched === null) {
      throw error('expected ' + tkName(type, text) + ' but found ' + tkName(tkType, tkVal));
    }
    return matched;
  }

  /**
   * slurps newlines
   * @param {boolean} separators - should separators be slurped too?
   * @returns {boolean} true if one or more characters were slurped
   */
  function slurp(separators) {
    for (
      var slurped = false;
      match(/*NEWLINE*/1) || (separators && match(/*SEPARATOR*/2));
      slurped = true
    ) {}
    return slurped;
  }

  /** 0: literal, 1: string, 2: table */
  var parseValueType;
  /**
   * attempts to parse a value, stores value type in `parseValueType`
   * @param {boolean} expected - throw on parse failure?
   * @returns {string} parsed value or null
   * @throws {@see SyntaxError} on parse failure
   */
  function parseValue(expected) {
    var literal = match(/*LITERAL*/4);
    var string = match(/*STRING*/5);
    var matched = literal || string;
    if (matched !== null) {
      parseValueType = literal ? 0 : 1;
      return matched.replace(unescapeRegex, unescapeReplacer);
    }
    var multiline = match(/*MULTILINE*/6);
    if (multiline !== null) {
      parseValueType = 1;
      return multiline;
    }
    if (tkType === /*OPERATOR*/3 && tkVal === '[') {
      parseValueType = 2;
      return parseTable(false);
    }
    return expected ? expect(/*LITERAL*/4) : null;
  }

  /**
   * parses a table
   * @param {boolean} root - is this the root table?
   * @throws {@see SyntaxError} on parse failure
   */
  function parseTable(root) {
    if (!root) {
      expect(/*OPERATOR*/3, '[');
    }
    slurp(true);

    var targetProperties = {};
    var targetElements = {}, length = 0;

    for (;;) {
      var left = parseValue(), right;
      if (left === null) {
        if (root ? match(/*EOF*/0) !== null : match(/*OPERATOR*/3, ']')) {
          break;
        } else {
          expect(/*LITERAL*/4);
        }
      }
      slurp();

      if (parseValueType > 1) {
        targetElements[length++] = left;
      } else if (!match(/*OPERATOR*/3, '=')) {
        targetElements[length++] = parseValueType ? left : parseLiteral(left);
      } else {
        slurp();

        right = parseValue(true);
        right = parseValueType ? right : parseLiteral(right);

        var leftIndex = +left;
        if (leftIndex === leftIndex && leftIndex >= 0) {
          targetElements[leftIndex] = right;
          if (length <= leftIndex) {
            length = leftIndex + 1;
          }
        } else if (hasOwnProperty(_Object_prototype, left)) {
          _Object.defineProperty(targetProperties, left, {
            value: right,
            writable: true,
            enumerable: true,
            configurable: true
          });
        } else {
          targetProperties[left] = right;
        }
      }

      slurp(true);
    }

    // ensure that the elements are copied into the final object in the correct order
    for (var i = 0; hasOwnProperty(targetElements, i); i++) {
      // no prototype check needed, Object.prototype will never contain numeric keys
      targetProperties[i] = targetElements[i];
    }
    for (var ii in targetElements) {
      if (ii > i) {
        targetProperties[ii] = targetElements[ii];
      }
    }

    return targetProperties;
  }

  return parseTable(true);
}
