var tar = require("tar-fs");
var gunzip = require("gunzip-maybe");
var needle = require("needle");
var fs = require("fs");

// platform:arch
var vlc = {
	"darwin:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-darwin.tar.gz",
	"linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-linux.tar.gz",
	"win32:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-win32.tar.gz",
};

// TODO: those URLs are temporary, use CI artifacts to download WebChimera.js
var electron44 = {
	"darwin:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/wcjs-darwin-x64-0.1.17.gz",
	"linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/wcjs-linux-x64-0.1.17.gz",
	"win32:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/wcjs-win-ia32-0.1.17.gz"
};
var webchimera = {
	electron: electron44,
	"electron44": electron44,
	"electron45": { 

	},
	nwjs: {

	},
	node: {

	}
};

var platform = process.env.PLATFORM || process.platform;
var arch = process.env.ARCH || process.arch;

var bundle = vlc[platform+":"+arch],
	wcjs = webchimera.electron[platform+":"+arch];

if (! bundle) throw "VLC build not found for "+platform+":"+arch;
if (! wcjs) throw "WebChimera.js build not found for "+platform+":"+arch;

var opts = {
	open_timeout: 20*1000,
	follow_max: 3,
}

console.log("Installing VLC bundle from "+bundle);
needle.get(bundle, opts).on("error", onerr).pipe(gunzip()).pipe(tar.extract(".")).on("error", onerr).on("finish", function() {
	console.log("VLC bundle installed");
});

console.log("Installing WebChimera.js.node from "+wcjs);
needle.get(wcjs, opts).on("error", onerr).pipe(gunzip()).on("error", onerr).pipe(fs.createWriteStream("./WebChimera.js.node")).on("finish", function() {
	console.log("WebChimera.js.node installed");
});

function onerr(err)
{
	throw err;
}