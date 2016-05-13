# <img alt="WebChimera.js Prebuilt" src="https://raw.githubusercontent.com/jaruba/wcjs-logos/master/logos/small/wcjs-prebuilt.png">

![badge](https://nodei.co/npm/wcjs-prebuilt.png?downloads=true)

Install [WebChimera.js](http://github.com/RSATom/WebChimera.js) prebuilt binaries **for Electron** using npm. This module allows you to set-up **WebChimera.js + embedded VLC** without compilation / additional steps.

WebChimera.js is a node.js binding to libvlc. You can use it to play video using a JS raw array buffer drawn via WebGL.

## Configuration

Before installing the package, you may need to configure a few things. Here's the list of configurable items:
  - Target architecture (supported: `ia32` / `x64`. Default value: machine's architecture)
  - Target platform (supported: `win` / `osx`. Default value: machine's platform)
  - Target WebChimera version (format: `vX.Y.Z`. Default value: latest)
  - Target runtime (supported: `electron` / `nw`. Default value: `electron`)
  - Target runtime version (format: `vX.Y.Z`. Default value: latest available for the target runtime and WebChimera version)
  - Target directory (where to install the binaries. Default value: `./bin`)

There are 2 ways you can configure these elements this:
  - With the `WCJS_ARCH`, `WCJS_PLATFORM`, `WCJS_VERSION`, `WCJS_RUNTIME`, `WCJS_RUNTIME_VERSION` and `WCJS_TARGET_DIR` environment variables. Here's an example:

  ```
  WCJS_RUNTIME=electron WCJS_RUNTIME_VERSION=v0.37.8 WCJS_VERSION=v0.2.4 npm install wcjs-prebuilt
  ```
  - By adding a `wcjs-prebuilt` hash to your root `package.json` and defining the following keys: `arch`, `platform`, `version`, `runtime`, `runtimeVersion`, `targetDir`. Here's an example:
  
  ```
  "wcjs-prebuilt": {
    "runtime": "electron"
    "runtimeVersion": "v0.37.8"
    "version": "v0.2.4"
  }
  ```

Please note that not all combinations of runtime versions and WebChimera versions are available. You can see a list of available options [here](https://github.com/RSATom/WebChimera.js/releases)

## Installation

```
npm install wcjs-prebuilt
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
