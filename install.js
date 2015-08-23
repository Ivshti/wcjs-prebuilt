var tar = require("tar-fs");
var gunzip = require("gunzip-maybe");
var needle = require("needle");

// platform:arch
var vlc = {
	"darwin:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-darwin.tar.gz",
	"linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-linux.tar.gz",
	"win32:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-win32.tar.gz",
};

// TODO: those URLs are temporary, use CI artifacts to download WebChimera.js
var webchimera = {
	electron: {
		"darwin:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/wcjs-darwin-x64-0.1.17.gz",
		"linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/wcjs-linux-x64-0.1.17.gz",
		"win32:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/wcjs-win-ia32-0.1.17.gz"
	},
	nwjs: {

	},
	node: {

	}
};

var platform = process.env.PLATFORM || process.platform;
var arch = process.env.ARCH || process.arch;

if (! vlc[platform+":"+arch]) throw "VLC build not found for "+platform+":"+arch;
if (! webchimera.electron[platform+":"+arch]) throw "WebChimera.js build not found for "+platform+":"+arch;

//tar.extract(instPath, { });