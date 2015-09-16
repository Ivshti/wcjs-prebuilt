var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var needle = require('needle');
var downloader = require('./lib/downloader');

var supported = {
    runtimes: ['nw.js', 'electron'],
    platforms: ['darwin', 'win32', 'win64', 'linux'],
    arch: ['ia32', 'x64'] //meh why not 
}


var urls = {
    vlc: {
        "darwin:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-darwin.tar.gz",
        "linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-linux.tar.gz",
        "win32:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-win32.tar.gz",
    }
}


function getDownloadUrls(data) {
    console.log(data)
    return new Promise(function(resolve, reject) {
        needle.get('https://api.github.com/repos/RSATom/WebChimera.js/releases/latest', {
            json: true
        }, function(err, resp) {
            if (err || !resp.body.assets)
                return reject('something went Very Wong:' + (err || "no assets!?!?!"));

            resp.body.assets.forEach(function(entry) {
                var filename = path.parse(entry.name).name;
                console.log(filename)
            });



        });



    })
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

        if (!supported.runtimes.indexOf(runtime) || !supported.platforms.indexOf(platform) || !supported.arch.indexOf(arch))
            reject('Unsupported runtime/arch/platform');
        else
            resolve({
                platform: platform,
                arch: arch,
                runtime: runtime
            });
    });

}




parseEnv()
    .then(getDownloadUrls)
    .catch(function(e) {
        console.log(e)
    })