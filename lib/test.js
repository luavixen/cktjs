const text = `
# A TOTALLY INCOMPLETE SPECIFICATION OF CRICKET TABLE NOTATION
# version 0.0.0

# DEFINITIONS:
newline = \\n (0x0A)
whitespace = [ space (0x20), \\t (0x09), \\v (0x0B), \\f (0x0C), \\r (0x0D) ]
escape sequences = [
    \\n = newline (0x0A)
    \\v = vertical tab (0x0B)
    \\f = formfeed line break (0x0C)
    \\r = carriage return (0x0D)
    \\t = tab (0x09)
    \\" = double quote (0x22)
    \\' = single quote (0x27)
    \\\\ = backslash (0x5C)
    # Commented out for cktjs, would fail with 'incomplete hex escape'
    #\\xNN = hexadecimal 8-bit value
    #\\uNNNN = hexadecimal unicode code point (UTF-8 encoded) (4 digits)
    #\\UNNNNNNNN = hexadecimal unicode code point (UTF-8 encoded) (8 digits)
]

# COMMENTS
# The hash symbol (#) starts a comment, and the comment goes all the way to the end of a line.
# They can be at the start of a line, or anywhere in the line.

# Every key is a string, and every value is either a string or a table.

# TABLES
# Tables are surrounded by [ ]
# The top level is also a table!

# Key-Value pairs are 'record style initializations':
record style initialization = this is the record style initialization
initialization with table = [ key = value ]

# Surrounding whitespace is trimmed; so this is equal
"initialization with table" = [ "key" = "value" ]

# Duplicate keys are overwritten!
x = 13
x = 16
# x now equals 16

# Unspecified keys in record-style initializations are invalid;
# = value
# However, empty keys are.
"" = value

# Bare values are 'list style initializations':
value1, value2
this has a list style table = [value 1, value 2]

# Ckt makes no ditinction between tables and lists.
# The keys of list style initialization is the previous list style key + 1,
# starting at 0 and counting up in decimal.
equivelant to list style table = [
    0 = value 1,
    1 = value 2
]

# You can even mix and match record style and list style initializations.
polyline = [
    color = blue; thickness = 2; npionts = 4
    [ x = 0;   y = 0 ]
    [ x = -10; y = 0 ]
    [ x = -10; y = 1 ]
    [ x = 0;   y = 1 ]
]

# In a table, newliens, commas, or semicolons seperate items, and they are mostly interchangable
seperated = [
    seperated, by, commas; and; by; semicolons
    and
    by
    newlines
]

# With only one difference:
# The parser should go through newlines and whitespace until it finds a non-neline, non-whitespace character.
# If the character is '=' then its a k/v pair; EG
this is valid
= value

# This is fine. This should be interpreted the same as "this is valid" = "value"
# However;

# v ADJUSTED FROM SPEC v
#this is invalid;
#= value
# ^ ADJUSTED FROM SPEC ^

# This is not valid. It will interpret "this is invalid" and "= value" as two items of a table using list initialization syntax,
# and will error, as '=' is not allowed in unquoted strings.

# Same goes here:
this is also valid=
value

# v ADJUSTED FROM SPEC v
#this is not also valid =;
#value
# ^ ADJUSTED FROM SPEC ^

# And of course:
this too is valid
=
value

# STRINGS
# Strings can be unquoted, quoted, or multiline

# Unquoted strings are not escaped (what you see is what you get)
this is a bare unquoted string
this string includes \\n which is not interpreted as a newline

# Quoted strings are surrounded by " or ', and are escaped (see escape sequences under DEFINITIONS)
'this is a quoted string'
"this is also a quoted string"

# This are useful if you need a string that includes any of [ ] = , ; | # " '
tag = "#Epic"

# Or if you need escaped characters
multiple lines quoted = "this string\\nspans\\nmultiple lines"

# Multiline strings start with a | on every line, and are mostly not escaped.
multiline string =
    |This string spans multiple lines.
    |Isn't it so cool?

# Aside from escape hatches. A \\ before a newline in a multiline string will cause the next line to be on the same.
# A \\ before the EOF should be interpreted as nothing.
singleline multiline string =
    |This string only spans \\
    |a single line.

singleine unquoted string = This string only spans a single line.

# Escape hatches themselves can be escaped.
escaped escape hatches =
    |This line ends in a single backslash. \\\\
    |This line ends with two! \\\\\\\\


# v ADJUSTED FROM SPEC v
# this tests the list functionality of the parser
# it turns any table that doesnt have explicit keys into a list
# the exception being that keys that follow the "index = value" format are also included
# (but only if they are in the right order)
beep beep = [
    yo what if
    gay rights
    [thatd be = very cool]
]
list test = [
    [these, words, will, return, as, a, list]

    [
        you can mix and match index keys and implicit/keyless list items
        1 = like this
        and this
        3 = annnd this
    ]

    [
        "however, it breaks when"
        2 = an index key is too far ahead
    ]

    [
        1 = and also if the keys are
        0 = out of order
        |note that in this case, the key 0 already contains "out of order"
        |but because this multiline has no key, it will get assigned an index key by the parser.
        |those always starts at 0, so the "out of order" string will get overwritten by this.
        |its a good idea to avoid situations like this by not giving a keyname at all if you want a list,
        |or giving descriptive, useful keynames if you want a dict
    ]
    "lists can be disabled in the interpreter by passing \\"allow_lists=False\\" to loads()"
]

heres some hex values = [
    hex ascii = sajfklsa \\x41\\x6E\\x6E\\x65 is my name
    unicode 4 digits = aaaa \\u0041\\u006e\\u006e\\u0065 is my name too
    unicode 8 digits = idk how to test this "\\U00000041" ?? is that correct??
]
this is a unicode symbol = 𝄠
thanks :3
`;

import { parse } from './parse.js';
import { stringify } from './stringify.js';

var object = parse(text);
console.log('ckt(raw) -> js');
console.log(object);
console.log('');
var string = stringify(object, '  ');
console.log('js -> ckt(generated)');
console.log(string);
console.log('');
var roundtripped = parse(string);
console.log('ckt(generated) -> js');
console.log(roundtripped);
console.log('');
