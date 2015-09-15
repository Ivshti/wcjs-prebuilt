var Promise = require('bluebird');
var fs = require('fs');
var path = require('path');


var supported = {
    runtimes: ['nw.js', 'electron'],
    platform: ['darwin', 'win32', 'win64', 'linux']
}

var urls = {

    vlc: {
        "darwin:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-darwin.tar.gz",
        "linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-linux.tar.gz",
        "win32:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-win32.tar.gz",
    }
}


function getDownloadUrls() {



    needle.get('google.com/search?q=syd+barrett', function(err, resp) {
        // if no http:// is found, Needle will automagically prepend it. 
    });
}


function parseEnv() {
    return new Promise(function(resolve, reject) {

        var platform = process.env.WCJS_PLATFORM || process.platform;
        var arch = process.env.WCJS_ARCH || process.arch;
        var runtime = process.env.WCJS_RUNTIME || "electron";

        try {
            // WARNING: this currently reads in our dear, so it's useless
            var manifest = require(path.join(process.cwd(), "package.json"));
            if (manifest.main.match("html$")) {
                console.log("nw.js runtime auto-detected");
                runtime = "nw.js";
            }
        } catch (e) {};

        if (!supported.runtimes[runtime] || !supported.platform[platform] || !supported.arch[arch])
            reject('unsupported runtime/arch/platform');
        else
            resolve({
                platform: platform,
                arch: arch,
                runtime: runtime
            });
    });

}