var tar = require("tar-fs");
var gunzip = require("gunzip-maybe");
var needle = require("needle");
var fs = require("fs");
var unzip = require("unzip");
var path = require("path");

// platform:arch
var vlc = {
	"darwin:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-darwin.tar.gz",
	"linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-linux.tar.gz",
	"win32:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-win32.tar.gz",
};

// TODO: those URLs are temporary, use CI artifacts to download WebChimera.js
var electron44 = {
	"darwin:x64": "https://github.com/RSATom/WebChimera.js/releases/download/v.0.1.28/WebChimera.js_electron_0.29.2_mac.zip",
	"win32:ia32": "https://github.com/RSATom/WebChimera.js/releases/download/v.0.1.28/WebChimera.js_electron_0.29.2_win.zip",
	"linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/wcjs-linux-x64-0.1.17.gz",
};
var webchimera = {
	electron: electron44,
	"electron44": electron44,
	"electron45": { 
		"darwin:x64": "https://github.com/RSATom/WebChimera.js/releases/download/v.0.1.28/WebChimera.js_electron_0.31.1_mac.zip",
		"win32:ia32": "https://github.com/RSATom/WebChimera.js/releases/download/v.0.1.28/WebChimera.js_electron_0.31.1_win.zip"
	},
	nwjs: {
		"win32:ia32": "https://github.com/RSATom/WebChimera.js/releases/download/v.0.1.28/WebChimera.js_nw_0.12.3_win.zip",
		"darwin:x64": "https://github.com/RSATom/WebChimera.js/releases/download/v.0.1.28/WebChimera.js_nw_0.12.3_mac.zip",
	},
	node: {

	}
};

var platform = process.env.PLATFORM || process.platform;
var arch = process.env.ARCH || process.arch;

var runtime = "electron";
try {
	var manifest = require(path.join(process.cwd(), "package.json"))
	if (manifest.main.match("html$")) { console.log("nw.js runtime auto-detected"); runtime = "nwjs"; }
} catch(e) { };
if (process.env.RUNTIME) {
	if (webchimera[process.env.RUNTIME]) runtime = process.env.RUNTIME;
	else throw "supported runtimes: "+Object.keys(webchimera).join(", ");
}
console.log("Using runtime: "+runtime);

var bundle = vlc[platform+":"+arch],
	wcjs = webchimera[runtime][platform+":"+arch];

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
(function(next) {
	var wcjsPipe =  needle.get(wcjs, opts).on("error", onerr);
	if (wcjs.match("zip")) wcjsPipe.pipe(unzip.Parse()).on("entry", function(entry) { next(entry) });
	else next(wcjsPipe);
})(function(wcjsPipe) {
	wcjsPipe.pipe(fs.createWriteStream("./WebChimera.js.node")).on("finish", function() {
		console.log("WebChimera.js.node installed");
	});
})


function onerr(err)
{
	throw err;
}