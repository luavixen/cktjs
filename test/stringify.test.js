import chai from "chai";
const { assert } = chai;

import { stringify } from '../lib/stringify.js';

const assertStringify = (...cases) => {
  for (const { input, indent, expected } of cases) {
    assert.strictEqual(stringify(input, indent), expected);
  }
};

describe('stringify', () => {

  it('stringifies JSON primitives', () => {
    assertStringify(
      { input: null, expected: 'null' },
      { input: false, expected: 'false' },
      { input: true, expected: 'true' },
      { input: 0, expected: '0' },
      { input: 1, expected: '1' },
      { input: 10, expected: '10' },
      { input: 1.0, expected: '1' },
      { input: 1.1, expected: '"1.1"' },
      { input: 1.01, expected: '"1.01"' },
      { input: 32, expected: '32' },
      { input: -98.44, expected: '"-98.44"' },
      { input: 1e33, expected: '"1e+33"' },
      { input: 6.0221409e+23, expected: '"6.0221409e+23"' },
      { input: -2.99792458e-6, expected: '"-0.00000299792458"' },
      { input: -9.6574e-99, expected: '"-9.6574e-99"' },
      { input: '', expected: '""' },
      { input: ' ', expected: '" "' },
      { input: 'hello', expected: 'hello' },
      { input: 'hello world', expected: 'hello world' },
      { input: 'hello, world', expected: '"hello, world"' },
      { input: 'hello_world', expected: 'hello_world' },
      { input: 'hello-world', expected: '"hello-world"' },
      { input: '1000 Cool Strings', expected: '1000 Cool Strings' },
      { input: '1000 Cool Strings!', expected: '"1000 Cool Strings!"' },
      { input: '1000! Cool Strings', expected: '"1000! Cool Strings"' },
      { input: '\uD83E\uDD7A', expected: '"\\ud83e\\udd7a"' },
      { input: '\x00\x1F\x7F', expected: '"\\x00\\x1f\\u007f"' },
      { input: '\x18weird\x1Aascii\x0C\x0Dcharacters\xFF\x1B', expected: '"\\x18weird\\x1aascii\\x0c\\rcharacters\\u00ff\\x1b"' },
    );
  });

  it('stringifies a simple object with nested objects and arrays', () => {
    const object = {
      a: 10,
      b: 20,
      c: 30,
      objectKey: 'stringValue',
      nestedObject: {
        x: null, y: false, z: true,
      },
      array: [
        'first element', 'second element', 'third element',
        { this: 'is the 4th element', name: { first: 'CKT', last: '???' } },
      ],
    };

    assertStringify({
      input: object,
      indent: 2,
      expected:
`a = 10
b = 20
c = 30
objectKey = stringValue
nestedObject = [
  x = null
  y = false
  z = true
]
array = [
  first element
  second element
  third element
  [
    this = is the 4th element
    name = [
      first = CKT
      last = "???"
    ]
  ]
]`,
    });

    assertStringify({
      input: object,
      expected: 'a=10,b=20,c=30,objectKey=stringValue,nestedObject=[x=null,y=false,z=true],array=[first element,second element,third element,[this=is the 4th element,name=[first=CKT,last="???"]]]',
    });
  });

  it('omits unsupported values', () => {
    assertStringify({
      input: {
        functions: [function () {}, (a, b, c) => a],
        symbols: [Symbol(), Symbol('test'), Symbol.iterator],
        undefined: [undefined, void 0],
        bigints: [0n, 10n, -32n, 10000000000000n],
        others: [null, false, true, 0, 1, '', 'hello'],
        objectOmitTest: {
          omit1: Symbol(),
          omit2: undefined,
          omit3: () => {},
          omit4: 100n,
          keep1: null,
          keep2: 40,
          keep3: 'kept!',
        },
      },
      expected: 'functions=[],symbols=[],undefined=[],bigints=[],others=[null,false,true,0,1,"",hello],objectOmitTest=[keep1=null,keep2=40,keep3="kept!"]',
    });
    assertStringify(
      { input: function () {}, expected: '' },
      { input: Symbol(), expected: '' },
      { input: undefined, expected: '' },
      { input: 2048n, expected: '' },
    );
  });

  it('unboxes boxed primitives', () => {
    assertStringify(
      { input: new Boolean(false), expected: 'false' },
      { input: new Boolean(true), expected: 'true' },
      { input: new Number(0), expected: '0' },
      { input: new Number(-10.44), expected: '"-10.44"' },
      { input: new String(''), expected: '""' },
      { input: new String('hello'), expected: 'hello' },
      {
        input: {
          a: new Boolean(true),
          b: new Number(1024),
          c: new String('test string!!'),
        },
        expected: 'a=true,b=1024,c="test string!!"',
      },
    );
  });

  it('respects toJSON', () => {
    assertStringify(
      { input: new Date(1629263887685), expected: '"2021-08-18T05:18:07.685Z"' },
      { input: { toJSON: () => [['yes']] }, expected: '[yes]' },
      {
        input: {
          a: { toJSON: () => [1, 2, 3, { four: 4 }] },
        },
        expected: 'a=[1,2,3,[four=4]]',
      },
    );
  });

  it('replaces invalid numbers with null', () => {
    assertStringify(
      { input: NaN, expected: 'null' },
      { input: Infinity, expected: 'null' },
      { input: -Infinity, expected: 'null' },
    );
  });

  it('detects cyclic references', () => {
    const x = { z: null };
    const y = { x: x };
    const z = { y: y };
    x.z = z;
    const array = [1, { two: 2 }, 3, 4, {}, 6, 7, { a: 8 }];
    const object = {
      date: new Date(),
      nested: {
        thisIsFalse: false,
        thisIsTrue: true,
        values: [[array]],
      },
    };
    array[3] = object;
    assert.throws(() => stringify(x), TypeError, 'CKT: cyclic reference');
    assert.throws(() => stringify(object), TypeError, 'CKT: cyclic reference');
  });

  it('handles mixed array/key-value tables', () => {
    const table = [0, 1, 2, 3, 4];
    table[5] = 5;
    table.bird = 'chirp';
    table[6] = 6;
    table[7] = 7;
    table[10] = 10;
    table.dog = 'woof';
    table.cat = 'meow';
    table[11] = 11;
    table[12] = 12;
    table[4938] = 4938;
    assertStringify({
      input: { table },
      expected: 'table=[0,1,2,3,4,5,6,7,10=10,11=11,12=12,4938=4938,bird=chirp,dog=woof,cat=meow]',
    });
    assertStringify({
      input: {
        0: 'zero',
        1: 'one',
        2: 'two',
        4: 'four',
        3: 'three', // Will be re-ordered due to the way object literals work
        numbers: 'yes',
        6: 'six',
      },
      expected: 'zero,one,two,three,four,6=six,numbers=yes',
    });
  });

  it('pretty prints using provided indent', () => {
    const document = {
      0: 'hello world',
      1: 'goodbye world',
      array: [
        10, 20, 30,
      ],
      object: {
        a: 10, b: 20, c: 30,
      },
      nested: [[[[['hello there!!! i\'m very indented :3']]]]],
    };
    assertStringify(
      {
        input: document,
        indent: false, // Ignored if not number or string
        expected: 'hello world,goodbye world,array=[10,20,30],object=[a=10,b=20,c=30],nested=[[[[["hello there!!! i\'m very indented :3"]]]]]',
      },
      {
        input: document,
        indent: 4, // 4 spaces
        expected: `hello world
goodbye world
array = [
    10
    20
    30
]
object = [
    a = 10
    b = 20
    c = 30
]
nested = [
    [
        [
            [
                [
                    "hello there!!! i'm very indented :3"
                ]
            ]
        ]
    ]
]`,
      },
      {
        input: document,
        indent: '\t\t\t', // 3 tabs
        expected: `hello world
goodbye world
array = [
\t\t\t10
\t\t\t20
\t\t\t30
]
object = [
\t\t\ta = 10
\t\t\tb = 20
\t\t\tc = 30
]
nested = [
\t\t\t[
\t\t\t\t\t\t[
\t\t\t\t\t\t\t\t\t[
\t\t\t\t\t\t\t\t\t\t\t\t[
\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t"hello there!!! i'm very indented :3"
\t\t\t\t\t\t\t\t\t\t\t\t]
\t\t\t\t\t\t\t\t\t]
\t\t\t\t\t\t]
\t\t\t]
]`,
      }
    );
  });

});
