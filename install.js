var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var needle = require('needle');
var _ = require('lodash');
var downloader = require('./lib/downloader');
var findProjectRoot = require('find-project-root');
var mkdirp = require('mkdirp');
var parsePath = require('parse-filepath');


var rootdir = findProjectRoot(process.cwd(), {
    maxDepth: 12
});

function getWCJS(data) {
    return new Promise(function(resolve, reject) {
        if (data.version !== 'latest')
            var url = 'https://api.github.com/repos/RSATom/WebChimera.js/releases/tags/' + data.version;

        getJson('https://api.github.com/repos/RSATom/WebChimera.js/releases/latest' || url)
            .then(function(json) {

                if (json.message && json.message === 'Not Found')
                    return reject('Version Tag Not Found')

                var downloadName = json.name;

                var availableVersions = [];

                _.remove(json.assets, function(asset) {
                    asset = parsePath(asset.name).name.split('_');
                    if (asset[1] === 'nw')
                        asset[1] = 'nw.js'
                    return (asset[1] === data.runtime && asset[3] === data.arch && asset[4] === data.platform); //remove all that are not for our runtime/arch/os.
                }).forEach(function(entry) {
                    availableVersions.push({
                        version: parsePath(entry.name).name.split('_')[2],
                        url: entry.browser_download_url,
                        name: parsePath(entry.name).name
                    })
                });
                if (data.runtimeVersion === 'latest') {
                    var downloadObject = _.last(availableVersions);
                } else {
                    var downloadObject = _(availableVersions)
                        .find(function(version) {
                            return version.version === data.runtimeVersion;
                        });
                }
                if (!downloadObject)
                    return reject('No download candidate availale')
                console.log('Aquiring:', downloadObject.name);
                downloader.downloadAndUnpack(data.targetDir, downloadObject.url)
                    .then(function() {
                        resolve(data);
                    });
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
                    var targetOS = parsePath(parsePath(entry.name).name).name.split('-');

                    if (/^win/.test(targetOS[2]))
                        var platform = 'win';
                    else
                        var platform = targetOS[2]

                    if (platform === data.platform)
                        asset = {
                            url: entry.browser_download_url,
                            version: targetOS[1],
                            platform: targetOS[2]
                        }
                });
                if (!asset)
                    return reject('No VLC libs found for this system');

                console.log('Retriving VLC Libs:', asset.version, asset.platform);
                downloader.downloadAndUnpack(data.targetDir, asset.url)
                    .then(resolve)

            })
            .catch(reject)
    });
}


function parseEnv() {

    var supported = {
        runtimes: ['electron', 'nw.js'],
        platforms: ['osx', 'win', 'linux'],
        arch: ['ia32', 'x64'] //meh why not 
    }



    return new Promise(function(resolve, reject) {


        try {
            var manifest = require(path.join(rootdir, "package.json"));
            manifest['wcjs-prebuilt'] = manifest['wcjs-prebuilt'] || {};
        } catch (e) {};

        var platform = (process.env.WCJS_PLATFORM || manifest['wcjs-prebuilt'].platform) ? true : process.platform;
        var arch = (process.env.WCJS_ARCH || manifest['wcjs-prebuilt'].runtime_arch) ? true : process.arch;
        var version = (process.env.WCJS_VERSION || manifest['wcjs-prebuilt'].version) ? true : 'latest';
        var runtime = (process.env.WCJS_RUNTIME || manifest['wcjs-prebuilt'].runtime) ? true : 'electron';
        var runtimeVersion = (process.env.WCJS_RUNTIME_VERSION || manifest['wcjs-prebuilt'].runtime_version) ? true : 'latest';
        var targetDir = (process.env.WCJS_TARGET || manifest['wcjs-prebuilt'].dir) ? true : './bin';

        mkdirp.sync(targetDir);

        if (/^win/.test(platform))
            platform = 'win';
        else if (platform === 'darwin')
            platform = 'osx'
        if (manifest)
            if (parsePath(manifest.main).extname === '.html') {
                if (!process.env.WCJS_RUNTIME) runtime = 'nw.js';
            }


        console.log('Runtime detected as:', runtime, '\nArch:', arch)

        if (!(supported.runtimes.indexOf(runtime) > -1) || !(supported.platforms.indexOf(platform) > -1) || !(supported.arch.indexOf(arch) > -1))
            reject('Unsupported runtime/arch/platform');
        else
            resolve({
                platform: platform,
                arch: arch,
                runtimeVersion: runtimeVersion,
                targetDir: targetDir,
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
