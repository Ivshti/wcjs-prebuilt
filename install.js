var fs = require('fs');
var path = require('path');
var Promise = require('bluebird');
var needle = require('needle');
var _ = require('lodash');
var downloader = require('./lib/downloader');
var findProjectRoot = require('find-project-root');
var mkdirp = require('mkdirp');
var parsePath = require('parse-filepath');


function getPlatformInfo() {
    if (/linux/.test(process.platform)) {
        return process.arch == 32 ? 'linux:ia32' : 'linux:x64';
    } else if (/darwin/.test(process.platform)) {
        return 'osx:' + process.arch;
    } else {
        return 'win:' + process.arch;
    }
}

var rootdir = findProjectRoot(process.cwd(), {
    maxDepth: 12
});

function getWCJS(data) {
    return new Promise(function(resolve, reject) {
        getJson(('https://api.github.com/repos/RSATom/WebChimera.js/releases/' + ((data.version === 'latest') ? 'latest' : 'tags/' + data.version)))
            .then(function(json) {
                if (json.message === 'Not Found') {
                    return reject('No WebChimera Download Found');
                }
                var candidate = false;

                _.forEach(json.assets, function(asset) {
                    var assetParsed = path.parse(asset.name).name.split('_');

                    var assetRuntime = {
                        type: assetParsed[1],
                        version: (data.version === 'latest') ? 'latest' : assetParsed[2],
                        arch: assetParsed[3],
                        platform: assetParsed[4]
                    };
                    if (_.isEqual(data.runtime, assetRuntime))
                        candidate = asset;
                });

                if (!candidate) {

                }

                console.log('Acquiring: ', candidate.name);

                downloader.downloadAndUnpack(data.dir, candidate.browser_download_url)
                    .then(function() {
                        resolve(data)
                    });
            })
            .catch(reject)
    });
}

function getVLC(data) {
    return new Promise(function(resolve, reject) {
        getJson('https://api.github.com/repos/guidupuy/vlc-prebuilt/releases/latest')
            .then(function(json) {
                if (json.message === 'Not Found') {
                    return reject('No VLC Download Found');
                }
                var candidate = false;

                var LookingObject = {
                    platform: data.runtime.platform,
                    arch: data.runtime.arch
                };

                _.forEach(json.assets, function(asset) {
                    var assetParsed = path.parse(asset.name).name.split('-');
                    var assetObject = {
                        platform: assetParsed[1],
                        arch: assetParsed[2].split('.')[0]
                    };
                    if (_.isEqual(assetObject, LookingObject))
                        candidate = asset;
                });

                if (!candidate) {
                    return reject('No VLC Download Found');
                }

                console.log('Acquiring:', candidate.name);

                downloader.downloadAndUnpack(data.dir, candidate.browser_download_url)
                    .then(resolve);

            })
            .catch(reject);
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
        } catch (e) {};

        var inf = (manifest && manifest['wcjs-prebuilt']) ? manifest['wcjs-prebuilt'] : {};

        var platform = process.env.WCJS_PLATFORM || inf.platform || getPlatformInfo().split(':')[0];
        var arch = process.env.WCJS_ARCH || inf.runtime_arch || getPlatformInfo().split(':')[1];
        var version = process.env.WCJS_VERSION || inf.version || 'latest';
        var runtime = process.env.WCJS_RUNTIME || inf.runtime || 'electron';
        var runtimeVersion = process.env.WCJS_RUNTIME_VERSION || inf.runtime_version || 'latest';
        var targetDir = process.env.WCJS_TARGET || inf.dir || './bin';

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
            return reject('Unsupported runtime/arch/platform');


        resolve({
            runtime: {
                type: runtime,
                version: runtimeVersion,
                arch: arch,
                platform: platform
            },
            dir: targetDir,
            version: version
        });
    });
}


function getJson(url) {
    return new Promise(function(resolve, reject) {
        needle.get(url, {
            json: true
        }, function(err, resp) {
            if (err || !resp.body)
                return reject('something went very wrong: ' + (err || "no body!?!?!"));
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
        console.log(e.message || e);
        if (e.stack) console.log(e.stack);
        process.exit(1); // indicate to npm that we've quit badly
    })
