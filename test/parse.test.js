import chai from "chai";
const { assert } = chai;

import { parse } from '../lib/parse.js';

const assertParse = (...cases) => {
  for (const { input, expected } of cases) {
    assert.deepEqual(parse(input), expected);
  }
};

describe('stringify', () => {

  it('returns an empty array for an empty document', () => {
    assertParse({ input: '', expected: [] });
  });

  it('parses the examples from the spec', () => {
    assertParse({
      expected: {
        authors: ['John Doe', 'Cricket Piapiac'],
        database: { server: '192.0.2.62', port: 143, files: 'payroll.dat' },
        key: 'value',
        another: 'here is the value',
        'unkeyed array': ['value1', 'value2'],
        'keyed array': ['value1', 'value2'],
        polyline: {
          colour: 'blue',
          thickness: 2,
          npoints: 4,
          0: { x:   0, y: 0 },
          1: { x: -10, y: 0 },
          2: { x: -10, y: 1 },
          3: { x:   0, y: 1 },
        },
        key: 'this is a quoted string', // Replaced!
        newlines: 'this is one line\nthis is another',
        quotes: 'this string has "quotation marks" in it!',
        'multiline string': 'this string has multiple lines!\nit also has "quotation marks" in it.\nit can include # any [ characters ].',
        table: {
          cat: 'meow',
          dog: 'woof',
        },
      },
      input: `
# derived from the CKT v0.1.0 spec
# https://git.sr.ht/~cricket/ckt/tree/f3d29afab63da85051f55643811a5d08bcf3bed4/item/SPEC

# Last modified 1 April 2021 by John Doe
authors = [ John Doe, Cricket Piapiac ]

database = [
    # Use IP address in case network name resolution isn't working
    server = 192.0.2.62
    port = 143
    files = "payroll.dat"
]

key = value
another =
    here is the value

unkeyed array = [
  value1
  value2
]
keyed array = [
  0 = value1
  1 = value2
]

polyline = [
  colour = blue; thickness = 2; npoints = 4
  [ x = 0;   y = 0 ]
  [ x = -10; y = 0 ]
  [ x = -10; y = 1 ]
  [ x = 0;   y = 1 ]
]

key = this is an unquoted string

"key" = "this is a quoted string"

newlines = "this is one line\\nthis is another"
quotes = "this string has \\"quotation marks\\" in it!"

multiline string =
    |this string has multiple lines!
    |it also has "quotation marks" in it.
    |it can include # any [ characters ].

table = [
  cat = "meow"
  dog = "woof"
]
`,
    });
  });

  it('passes the stress test', () => {
    assertParse({
      expected: {
        '0': 'c',
        '1': '123\n'
          + '    4596    \n'
          + '789\n'
          + '||| | | ||| | <- this works ?? some how\n'
          + '\n\n'
          + ' <- literally all of the whitespace characters cktjs supports\n',
        '2': ' these',
        '3': ' are two different strings',
        '4': ' as are',
        '5': ' these',
        '6': 'you can also nest tables!!',
        '7': [[[['like this']]]],
        '8': 'also!! a note on whitespace trimming',
        '9': 'and finally!!! a cktjs-specific feature',
        '10': 'literals that are also valid javascript literals get transformed as such',
        ten: 10,
        nine: 9,
        eight: '8',
        "'seven'": "'7'",
        six: 6,
        five: 5,
        four: 4,
        'тнгее': 'тнгее',
        'two 🥺': ' 🥺 ',
        "`!@$%^&*()-_+{}|':<>/? ONE": '\x00\n\r\t\x0B\f\b\x00\x1F3ÿሴ\n',
        table: {
          '0': 'you can put array elements in here',
          '1': 'like this',
          '2': 'and this',
          '3': 'or\tthis',
          '4': 'maybe',
          '5': 'this!',
          '6': 'like normal!',
          '7': 'you can also make elements by using the next index as the key',
          '8': "even if it's a string",
          '9': 'or an escaped number thing !!',
          '11': false,
          '12': true,
          '13': 'null',
          '14': "which shouldn't work!! but due to the way arrays work in javascript",
          '15': 'it ends up making an array with holes',
          '16': 'these expressions will all be true:',
          '17': 'table[10] === undefined',
          '18': 'table[11] === false',
          '19': 'table[12] === true',
          '20': 'table[13] === null',
          '21': 'you can also really fuck shit up',
          'OR !! you can make keys': 'and values',
          '(like this one) will let': 'you do weird things like...',
          '281474976710656': 'this table will have 2^48 elements!! woah!!',
          '281474976710657': 'and this will be the (2^48)+1th :'
        },
        'fucked table': [ '1', '2', '3', '8', '4' ],
        "there's also a fancy way to write a multiline string": 'like this!!\n' +
          'this text will be dumped verbatim\n' +
          'even escapes!! \\x32 and \\u0000 are treated literally, not unescaped \n' +
          '  note that cktjs does NOT add a trailing newline\n' +
          '  so this newline will be IGNORED ->',
        and: {
          '0': 'you can nest them',
          '1': { '0': ['to infinity'], 'keep em going': 'weeeee' },
          'like this too': [
            'and just!! keep going',
            'to infinity',
            'or until the stack runs out'
          ]
        },
        'this will have no whitespace around it': 'this will have no whitespace around it',
        ' \t\tbut this will!!\f': ' \t\tbut this will!!\f',
        literals: [
          'null',       'true',
          'false',      '1',
          '10',         '-10',
          '+10',        '10e32',
          '10E31',      '3.4',
          '-3.443e+12', '-0090.090E-2',
          "'null'",     'true',
          'fAlse',      '+-10',
          '10:3',       '1ee4',
          '*3',         "'10'"
        ]
      },
      input: `
# comment
# another comment

ten = 10
nine=9
"eight"="8"
'seven'  =  '7',six =
6
  five

# let's see you try and parse this!!\x20\x20

=#3 ... just kidding :)

    5;\\x66\\x6F\\x75\\x72=\\x34 # this should parse as {four: 4}
\\u0442\\u043d\\u0433\\u0435\\u0435
=
"\\u0442\\u043d\\u0433\\u0435\\u0435" # "тнгее" cyrillic script

 two \\ud83E\\uDd7A  =  " \\ud83E\\uDd7A "
 #   ^ pleading emoji :3

 # \/ every special key on my kb
 \`!@$%^&*()-_+{}\\|':<>/? ONE = \\0\\n\\r\\t\\v\\f\\b\\x00\\x1F\\x33\\xFF\\u1234\\n

table = [
  you can put array elements in here
  like this\x20
  and this;\tor\tthis\x20\x20
  , maybe ;   this!
  OR !! you can make keys = and values, like normal!
  7 = you can also make elements by using the next index as the key
  "8" = even if it's a string;\\x39=or an escaped number thing !!
  # some implementations
  (like this one) will let = you do weird things like...
  12 = true
  11 = false
  null
  which shouldn't work!! but due to the way arrays work in javascript,
  it ends up making an array with holes,
  these expressions will all be true:
  "table[10] === undefined"
  "table[11] === false"
  "table[12] === true"
  "table[13] === null"
  you can also really fuck shit up
  281474976710656 = this table will have 2^48 elements!! woah!!
  and this will be the (2^48)+1th :]c

fucked table=[;,;,;,;,;;;,;;

;,;;, ,; ,; ,;;,;;, ,; ;1 ,; ;2;,3;,,;;,;,;,;,;,\x20

\t\t\v\t \f\r8\v\f\r; \x20
4;,
,,;\x20\x20

;;;;;;;;;;;;;;;]

there's also a fancy way to write a multiline string =
  |like this!!
  |this text will be dumped verbatim
  |even escapes!! \\x32 and \\u0000 are treated literally, not unescaped\x20
  |  note that cktjs does NOT add a trailing newline
  |  so this newline will be IGNORED ->

|123
  |    4596   \x20
                                      |789
|||| | | ||| | <- this works ?? some how
|
   |
   \t\v\f\r | <- literally all of the whitespace characters cktjs supports
|
# ^ trailing newline

 | these
,| are two different strings

| as are

         | these

you can also nest tables!!

[[[[like this]]]]

and = [
  you can nest them
  like this too = [
    and just!! keep going,
    to infinity
    or until the stack runs out;
  ];[
    keep em going = weeeee,[  to infinity    ]
  ]
  #[][]
  #^ invalid btw
]

also!! a note on whitespace trimming
  \r   \t this will have no whitespace around it \t\t   \v \f = "this will have no whitespace around it"
  \\x20\t\tbut this will!!\\f = " \t\tbut this will!!\f"

and finally!!! a cktjs-specific feature,
literals that are also valid javascript literals get transformed as such

literals = [
  null
  true
  false
  1
  10
  -10
  +10
  10e32
  10E31
  3.4
  -3.443e+12
  -0090.090E-2
  # these are not valid, however
  'null'
  "true"
  fAlse
  +-10
  10:3
  1ee4
  *3
  '10'
  # etc...
]

`,
    });
  });

  it('redefines properties that clash with Object.prototype', () => {
    const object = parse('hasOwnProperty=all of these,__defineGetter__=should get,propertyIsEnumerable=redefined');
    assert.strictEqual(object.hasOwnProperty, 'all of these');
    assert.strictEqual(object.__defineGetter__, 'should get');
    assert.strictEqual(object.propertyIsEnumerable, 'redefined');
  });

  it('ignores __proto__', () => {
    const object = parse('__proto__="prototype pollution?"');
    assert.strictEqual(Object.getOwnPropertyDescriptor(object, '__proto__'), undefined);
  });

  it('generates errors for invalid syntax', () => {
    assert.throws(() => parse('\\'), SyntaxError, 'CKT 1:1 unexpected character');
    assert.throws(() => parse('\\x'), SyntaxError, 'CKT 1:3 incomplete hex escape');
    assert.throws(() => parse('\\u'), SyntaxError, 'CKT 1:3 incomplete hex escape');
    assert.throws(() => parse('='), SyntaxError, 'CKT 1:1 expected value');
    assert.throws(() => parse('['), SyntaxError, 'CKT 1:2 expected value');
    assert.throws(() => parse('|\n='), SyntaxError, 'CKT 4:2 unexpected =');
  });

});
