var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var needle = require('needle');
var _ = require('lodash');
var downloader = require('./lib/downloader');

var supported = {
    runtimes: ['nw.js', 'electron'],
    platforms: ['osx', 'win', 'linux'],
    arch: ['ia32', 'x64'] //meh why not 
}


var urls = {
    vlc: {
        "osx:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-darwin.tar.gz",
        "linux:x64": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-linux.tar.gz",
        "win:ia32": "https://github.com/Ivshti/vlc-prebuilt/raw/master/vlc-2.2-win32.tar.gz",
    }
}


function getDownloadUrls(data) {
    console.log(data)
    return new Promise(function(resolve, reject) {
        if (data.version !== 'latest')
            var url = 'https://api.github.com/repos/RSATom/WebChimera.js/releases/tags/' + data.version;

        getJson('https://api.github.com/repos/RSATom/WebChimera.js/releases/latest' || url)
            .then(function(json) {
                if (json.message && json.message === 'Not Found')
                    return reject('Version Tag Not Found')


                var availableVersions = [];

                _.remove(json.assets, function(asset) {
                    asset = path.parse(asset.name).name.split('_');
                    return (asset[1] === data.runtime && asset[3] === data.arch && asset[4] === data.platform); //remove all that are not for our runtime & arch.
                }).forEach(function(entry) {
                    availableVersions.push(path.parse(entry.name).name.split('_')[2])
                });
                if (data.runtimeVersion === 'latest')
                    var downloadVersion = Math.max(availableVersions)



            })
            .catch(reject)

    });
}



function parseEnv() {
    return new Promise(function(resolve, reject) {

        var platform = process.env.WCJS_PLATFORM || process.platform;
        var arch = process.env.WCJS_ARCH || process.arch;
        var version = process.env.WCJS_VERSION || 'v0.1.30';
        var runtime = process.env.WCJS_RUNTIME || "electron";
        var runtimeVersion = process.env.WCJS_RUNTIME_VERSION || 'latest';

        if (/^win/.test(platform))
            platform = 'win';
        else if (platform === 'darwin')
            platform = 'osx'

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
                runtimeVersion: runtimeVersion,
                version: version,
                runtime: runtime
            });
    });

}


function getJson(url) {
    return new Promise(function(resolve, reject) {
        needle.get(url, {
            json: true
        }, function(err, resp) {
            if (err || !resp.body)
                return reject('something went Very Wong:' + (err || "no body!?!?!"));
            resolve(resp.body)
        });
    })
}

parseEnv()
    .then(getDownloadUrls)
    .catch(function(e) {
        console.log(e)
    })