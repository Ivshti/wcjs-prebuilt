# <img alt="WebChimera.js Prebuilt" src="https://raw.githubusercontent.com/jaruba/wcjs-logos/master/logos/small/wcjs-prebuilt.png">

![badge](https://nodei.co/npm/wcjs-prebuilt.png?downloads=true)

Install [WebChimera.js](http://github.com/RSATom/WebChimera.js) prebuilt binaries **for Electron** using npm. This module allows you to set-up **WebChimera.js + embedded VLC** without compilation / additional steps.

WebChimera.js is a node.js binding to libvlc. You can use it to play video using a JS raw array buffer drawn via WebGL.

## Installation

```
npm install wcjs-prebuilt
```

## Configuration

The following elements can be configured:
  - Target architecture (supported: `ia32` / `x64`) (default value: machine's architecture)
  - Target platform (supported: `win` / `osx`) (default value: machine's platform)
  - Target runtime (supported: `electron` / `nw`) (default value: `electron`)
  - Target runtime version (format: `vX.Y.Z`, eg `v0.37.8`) (default value: latest available for the target runtime and WebChimera version)
  - Target WebChimera version (format: `vX.Y.Z`, eg `v0.2.4`) (default value: latest)

You'll generally want to configure at least the runtime, as well as the WebChimera and runtime versions. 

You can specify each of these items in 2 ways:
  - With the `WCJS_ARCH`, `WCJS_PLATFORM`, `WCJS_RUNTIME`, `WCJS_RUNTIME_VERSION` and `WCJS_VERSION` environment variables.
  Here's an example:

  ```
  WCJS_ARCH=ia32 WCJS_PLATFORM=win WCJS_RUNTIME=electron WCJS_RUNTIME_VERSION=v0.37.8 WCJS_VERSION=v0.2.4 npm install wcjs-prebuilt
  ```
  - By adding a `wcjs-prebuilt` hash to your root `package.json`. This example should be self-explanatory:
  
  ```
  "wcjs-prebuilt": {
    "arch": "x64"
    "platform": "osx"
    "runtime": "electron"
    "runtimeVersion": "v0.37.8"
    "version": "v0.2.4"
  }
  ```

## Programmatic usage
```javascript
var wcjs = require("wcjs-prebuilt");
// wcjs is WebChimera.js
```

## Used in (ordered by date of adoption)
* [Stremio](http://www.strem.io) - since version 2.0
* [Powder Player](http://powder.media) - since version 0.90
* [Popcorn Time](https://popcorntime.io) - not yet released with WebChimera.js, in progress


(please PR other use cases)
