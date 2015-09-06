# wcjs-prebuilt

![badge](https://nodei.co/npm/wcjs-prebuilt.png?downloads=true)

Install [WebChimera.js](http://github.com/RSATom/WebChimera.js) prebuilt binaries **for Electron** using npm. This module allows you to set-up **WebChimera.js + embedded VLC** without compilation / additional steps.

WebChimera.js is a node.js binding to libvlc. You can use it to play video using a JS raw array buffer drawn via WebGL.


## Installation

```
npm install wcjs-prebuilt
```

You can install the module for another platform than the one you're running - for example if you want to package your application for another OS. To do that, use the ``WCJS_PLATFORM``, ``WCJS_ARCH`` environment variables.

For example, to install for Windows under any OS, use
```
WCJS_PLATFORM=win32 WCJS_ARCH=ia32 npm install wcjs-prebuilt
```

Currently supported runtimes are:
* ``electron`` / ``electron44`` - Electron 0.29.x, based on chromium 44
* ``electron45`` - electron 0.31.x, based on chromium 45
* ``nwjs`` - latest NW.js

## Programmatic usage
```javascript
var wcjs = require("wcjs-prebuilt");
// wcjs is WebChimera.js
```
