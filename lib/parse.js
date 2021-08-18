import { len, hasOwnProperty } from './utils.js';
import { _Object, _Object_prototype, _String, _SyntaxError, _parseInt  } from './globals.js';

/** Matches a simple positive integer */
var integerRegex = /^(?:0|[1-9]\d*)$/;
/** Matches a newline, followed by whitespace, followed by the vertical bar */
var multilineSplitRegex = /(?:^|\n)[ \t\v\f\r]*\|?/g;

/** Matches a backslash, followed by an escape sequence [, unicode, ascii, char] */
var unescapeRegex = /\\(?:(?:u([0-9a-fA-F]{4}))|(?:x([0-9a-fA-F]{2}))|(.))/g;
/** Map of escape characters to their raw values */
var unescapeChars = {
  0: '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  v: '\v',
  f: '\f',
  b: '\b'
};

/** Map of literal strings to static primitive values */
var staticPrimitives = { null: null, true: true, false: false };

/**
 * Parses a CKT literal and attempts to convert it to a number/boolean/null
 * @param {string} string
 * @returns {string|number|boolean|null}
 */
function parseLiteral(string) {
  if (hasOwnProperty(staticPrimitives, string)) {
    return staticPrimitives[string];
  }
  var number = +string;
  if (number === number) {
    return number;
  }
  return string;
}

/*
var EOF = 0
  , NEWLINE = 1
  , SEPARATOR = 2
  , OPERATOR = 3
  , LITERAL = 4
  , STRING = 5
  , MULTILINE = 6;
*/

export function parse(script) {
  // Coerce the `script` to a string
  script += '';

  /** Current line number */
  var line = 1;
  /** Current column number */
  var column = 1;

  /**
   * Creates a new instance of {@see SyntaxError} with the current line/column numbers
   * @param {*} message - Message to attach to this error
   * @returns {SyntaxError}
   */
  function error(message) {
    return new _SyntaxError('CKT ' + line + ':' + (column - (tkString ? len(tkString) : 0)) + ' ' + message);
  }

  /**
   * Replacer for `unescapeRegex` that unescapes escape sequences
   * @returns {string} Unescaped character
   * @throws {@see SyntaxError} on invalid escape sequence
   */
  function unescapeReplacer(_, hex1, hex2, char) {
    var hex = hex1 || hex2;
    if (hex) {
      return _String.fromCharCode(_parseInt(hex, 16));
    }
    if (char === 'u' || char === 'x') {
      throw error('incomplete hex escape');
    }
    if (hasOwnProperty(unescapeChars, char)) {
      return unescapeChars[char];
    }
    return char;
  }

  /** Matches a token [, whitespace, newline, separator, punctuation, literal, string, multiline, invalid] */
  var tkRegex = /([ \t\v\f\r]+)|(\n|#.*(?:\n|$))|([;,]+)|([=\[\]])|((?:[^\n;,"|=\[\]#\\]|\\.)*(?:[^ \t\v\f\r\n;,"|=\[\]#\\]|\\.))|("(?:\\"|.)*?")|((?:[ \t\v\f\r]*\|.*\n)+)|(.)/g;
  // Do NOT move ^this regex outside of this function unless you reset `lastIndex`

  /** Token type (EOF/NEWLINE/SEPARATOR/OPERATOR/LITERAL/STRING/MULTILINE) */
  var tkType;
  /**
   * Token string value
   *  - Contains the inner value for string/multiline
   *  - Contains the entire matched substring otherwise
   */
  var tkString;

  /**
   * Parses the next token and sets `tkType` and `tkString`
   * @throws {@see SyntaxError} on invalid token
   */
  function tkNext() {
    var result, type, string, length;

    // Slurp whitespace
    while (
      (result = tkRegex.exec(script)) &&
      (length = len(result[0]), string = result[1])
    ) {
      column += length;
    }

    if (result) {
      if (result[8]) {
        throw error('unexpected character');
      }

      // Detect the type of the match
      for (
        string = result[0], type = 1;
        type < 8 && result[type + 1] == null;
        type++
      ) {}

      // Increment line and column numbers
      if (type < /*SEPARATOR*/2 /* type === NEWLINE */) {
        line++;
        column = 1;
      } else {
        column += length;
      }

      // Remove quotes from strings
      if (type === /*STRING*/5) {
        string = string.slice(1, length - 1);
      }

      // Unescape escape sequences in literals and strings
      if (type > /*OPERATOR*/3 && type < /*MULTILINE*/6 /* type === LITERAL || type === STRING */) {
        string = string.replace(unescapeRegex, unescapeReplacer);
      }

      // Remove whitespace/bars from multiline strings
      if (type > /*STRING*/5 /* type === MULTILINE */) {
        var lines = string.split(multilineSplitRegex);
        var linesLength = len(lines);
        lines = lines.slice(1, linesLength - 1);
        string = lines.join('\n');
        // Adjust line and column numbers to be correct
        line += linesLength;
        column = 1;
      }

      tkType = type;
      tkString = string;
    } else {
      tkType = /*EOF*/0;
      tkString = '';
    }
  }

  /**
   * Matches a token by type and/or value
   * @param {number} type
   * @param {string|undefined} string
   * @returns {string|undefined} Matched token value or undefined
   */
  function tkMatch(type, string) {
    if (tkType === type && (!string || tkString === string)) {
      var match = tkString;
      if (tkType > /*EOF*/0) {
        tkNext();
      }
      return match;
    }
  }

  /**
   * Repeatedly matches newlines (and other separators if enabled)
   * @param {boolean} separators - Should separators be matched too?
   * @returns {boolean} True if one or more characters were matched
   */
  function tkSlurp(separators) {
    for (
      var matched = false;
      tkMatch(/*NEWLINE*/1) || (separators && tkMatch(/*SEPARATOR*/2));
      matched = true
    ) {}
    return matched;
  }

  /**
   * Type of the parsed value, set by `parseValue`
   *  - 0: Literal
   *  - 1: Normal string
   *  - 2: Multiline string
   *  - 3: Table
   */
  var parseValueType;
  /**
   * Parses a CKT value
   * @returns {string}
   * @throws {@see SyntaxError} on parse failure
   */
  function parseValue() {
    for (var type = 4; type < 7; type++) {
      var match = tkMatch(type);
      if (match != null) {
        parseValueType = type - 4;
        return match;
      }
    }

    if (tkMatch(/*OPERATOR*/3, '[')) {
      parseValueType = 3;
      return parseTable(false);
    }

    throw error('expected value');
  }

  /**
   * Parses a CKT table
   * @param {boolean} root - Is this the root table?
   * @returns {Object|Array}
   * @throws {@see SyntaxError} on parse failure
   */
  function parseTable(root) {
    // `elements` is a lazy-initialized array of numerically indexed elements
    var elements, length = 0;
    // `properties` is a lazy-initialized object of key-value properties
    var properties;

    for (;;) {
      tkSlurp(true);

      if ((root ? tkMatch(/*EOF*/0) : tkMatch(/*OPERATOR*/3, ']')) != null) {
        break;
      }

      var left = parseValue(), leftIndex, right;

      tkSlurp(false);

      if (tkMatch(/*OPERATOR*/3, '=')) {
        if (parseValueType > 1) {
          throw error('unexpected =');
        }

        tkSlurp(false);

        right = parseValue();
        right = parseValueType ? right : parseLiteral(right);

        if (integerRegex.test(left)) {
          leftIndex = +left;
          if (leftIndex >= length) {
            length = leftIndex + 1;
          }

          if (!elements) {
            elements = [];
          }
          elements[leftIndex] = right;
        } else {
          if (!properties) {
            properties = {};
          }

          if (hasOwnProperty(_Object_prototype, left)) {
            _Object.defineProperty(properties, left, {
              value: right,
              writable: true,
              enumerable: true,
              configurable: true
            });
          } else {
            properties[left] = right;
          }
        }
      } else {
        if (!elements) {
          elements = [];
        }
        elements[length++] = left;
      }
    }

    if (properties && elements) {
      for (var i = 0; hasOwnProperty(elements, i); i++) {
        properties[i] = elements[i];
      }
      for (var ii in elements) {
        if (ii >= i) {
          properties[ii] = elements[ii];
        }
      }
    }

    return properties || elements || [];
  }

  tkNext();
  return parseTable(true);
}
