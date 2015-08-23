# wcjs-prebuilt

![badge](https://nodei.co/npm/wcjs-prebuilt.png?downloads=true)

Install [WebChimera.js](http://github.com/RSATom/WebChimera.js) prebuilt binaries **for Electron** using npm. This module allows you to set-up **WebChimera.js + embedded VLC** without compilation / additional steps.

WebChimera.js is a node.js binding to libvlc. You can use it to play video using a JS raw array buffer drawn via WebGL.


## Installation

```
npm install wcjs-prebuilt
```

You can install the module for another platform than the one you're running - for example if you want to package your application for another OS. To do that, use the ``PLATFORM``, ``ARCH`` environment variables.

For example, to install for Linux, use
```
ARCH=x86 PLATFORM=linux npm install wcjs-prebuilt
```

In terms of runtimes, wcjs-prebuilt only supports **Electron**. Expect packages for nwjs and node.js in the future (PRs / forks would be appreciated).
