<p>
  <a href="https://www.npmjs.com/package/cktjs">
    <img src="https://badgen.net/npm/v/cktjs?style=flat-square">
  </a>
  <a href="https://www.npmjs.com/package/cktjs?activeTab=dependencies">
    <img src="https://badgen.net/bundlephobia/dependency-count/cktjs?style=flat-square">
  </a>
  <a href="https://github.com/luavixen/cktjs/blob/master/lib/index.d.ts">
    <img src="https://badgen.net/npm/types/cktjs?style=flat-square">
  </a>
  <a href="https://bundlephobia.com/result?p=cktjs">
    <img src="https://badgen.net/bundlephobia/minzip/cktjs?style=flat-square">
  </a>
  <a href="https://github.com/luavixen/cktjs/actions">
    <img src="https://badgen.net/github/status/luavixen/cktjs/master?label=build&style=flat-square">
  </a>
  <a href="https://coveralls.io/github/luavixen/cktjs">
    <img src="https://badgen.net/coveralls/c/github/luavixen/cktjs?style=flat-square">
  </a>
  <a href="https://github.com/luavixen/cktjs/blob/master/LICENSE">
    <img src="https://badgen.net/github/license/luavixen/cktjs?style=flat-square">
  </a>
</p>

# cktjs
cktjs is an implementation of a decoder and encoder for the [CKT config language](https://cricket.piapiac.org/software/ckt/).
It aims to be a drop-in replacement for JavaScripts's built in [JSON library](https://tc39.es/ecma262/#sec-json-object) minus support for `reviver` and `replacer`.

## Installation
The cktjs npm package provides the original ES module source plus CommonJS and browser IIFE builds.
It can be installed with:
```sh
npm install cktjs
```

Alternatively, you can use the browser IIFE build directly from a CDN.
Currently, cktjs officially supports [unpkg](https://www.unpkg.com/) and [jsdelivr](https://www.jsdelivr.com/):
```html
<!-- unpkg -->
<script src="https://www.unpkg.com/cktjs@1.0"></script>
<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/cktjs@1.0"></script>
```

## Usage

### Import cktjs
```javascript
// CommonJS
const CKT = require('cktjs');
// ESModules
import * as CKT from 'cktjs';
```

### Parse a CKT document
```javascript
const config = CKT.parse(`
rate limits = [
  /* = [
    request limit = 100
    window length = 2s
  ]
  /api/upload = [
    size limit = 100mb
    request limit = 6
    window length = 5s
  ]
]
`);
```
```javascript
{
  'rate limits': {
    '/*': {
      'request limit': 100,
      'window length': '2s'
    },
    '/api/upload': {
      'size limit': '100mb',
      'request limit': 6,
      'window length': '5s'
    }
  }
}
```

### Encode an object as a CKT document
```javascript
const menu = {
  "id": "file",
  "value": "File",
  "popup": {
    "menuitem": [
      { "value": "New"  , "onclick": "CreateNewDoc()" },
      { "value": "Open" , "onclick": "OpenDoc()"      },
      { "value": "Close", "onclick": "CloseDoc()"     },
    ],
  },
};
const text = CKT.stringify(menu, 2);
```
```lua
id = file
value = File
popup = [
  menuitem = [
    [
      value = New
      onclick = "CreateNewDoc()"
    ]
    [
      value = Open
      onclick = "OpenDoc()"
    ]
    [
      value = Close
      onclick = "CloseDoc()"
    ]
  ]
]
```

## Authors
Made with ❤ by Lua MacDougall ([foxgirl.dev](https://foxgirl.dev/)).

## License
This project is licensed under the [MIT license](LICENSE).
