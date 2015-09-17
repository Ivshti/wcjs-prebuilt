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



function getWCJS(data) {
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
                    return (asset[1] === data.runtime && asset[3] === data.arch && asset[4] === data.platform); //remove all that are not for our runtime/arch/os.
                }).forEach(function(entry) {
                    availableVersions.push({
                        version: path.parse(entry.name).name.split('_')[2],
                        download: entry.browser_download_url
                    })
                });
                if (data.runtimeVersion === 'latest') {
                    console.log('Retriving WCJS:', _.last(availableVersions).version);
                    downloader.downloadAndUnpack('./', _.last(availableVersions).download)
                        .then(function() {
                            resolve(data);
                        })
                } else {
                    var downloadUrl = _(availableVersions)
                        .filter(function(version) {
                            return version.version === data.runtimeVersion;
                        })
                        .pluck('download')
                        .value()[0];
                    console.log('Retriving WCJS:', version.version);
                    downloader.downloadAndUnpack('./', downloadUrl)
                        .then(function() {
                            resolve(data);
                        })
                }
            })
            .catch(reject)
    });
}

function getVLC(data) {
    return new Promise(function(resolve, reject) {

        getJson('https://api.github.com/repos/Ivshti/vlc-prebuilt/releases/latest')
            .then(function(json) {

                var asset = false;
                json.assets.forEach(function(entry) {
                    var targetOS = path.parse(path.parse(entry.name).name).name.split('-');

                    if (/^win/.test(targetOS[2]))
                        targetOS[2] = 'win';

                    if (targetOS[2] === data.platform)
                        asset = {
                            url: entry.browser_download_url,
                            version: targetOS[1]
                        }
                });
                if (!asset)
                    return reject('No VLC libs found for this system');

                console.log('Retriving VLC Libs:', asset.version);
                downloader.downloadAndUnpack('./', asset.url)
                    .then(resolve)

            })
            .catch(reject)
    });
}


function parseEnv() {
    return new Promise(function(resolve, reject) {

        var platform = process.env.WCJS_PLATFORM || process.platform;
        var arch = process.env.WCJS_ARCH || process.arch;
        var version = process.env.WCJS_VERSION || 'latest';
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
    .then(getWCJS)
    .then(getVLC)
    .then(function() {
        console.log('WCJS & VLC Libs Downloaded');
    })
    .catch(function(e) {
        console.log(e)
    })