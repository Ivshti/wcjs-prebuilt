var fs = require('fs-extra');
var path = require('path');
var Promise = require('bluebird');
var needle = require('needle');
var _ = require('lodash');
var downloader = require('./lib/downloader');
var findProjectRoot = require('find-project-root');
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

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getWCJS(data) {
    return new Promise(function(resolve, reject) {
        var wcjsUrl = 'https://api.github.com/repos/RSATom/WebChimera.js/releases/' + (data.version === 'latest' ? 'latest' : ('tags/' + data.version));
        console.log('');
        console.log('Looking for WebChimera download at ' + wcjsUrl);
        console.log('');
        getJson(wcjsUrl)
            .then(function(json) {
                if (json.message === 'Not Found') {
                    reject('No WebChimera release found at the searched URL');
                }
                var candidate = null;

                _.every(json.assets, function(asset) {
                    var assetParsed = path.parse(asset.name).name.replace('.tar', '').split('_');
                    
                    if(asset.name.toLowerCase().indexOf('vlc') == -1){
                        console.log(asset.name, '\x1b[31m', 'doesn\'t include VLC','\x1b[0m');
                        return true;
                    }

                    var assetRuntime = {
                        type: assetParsed[2],
                        version: (data.version === 'latest') ? 'latest' : assetParsed[3],
                        arch: assetParsed[6],
                        platform: assetParsed[7]
                    };
                    if (_.isEqual(data.runtime, assetRuntime)){
                        candidate = asset;
                        console.log(asset.name, '\x1b[32m', 'matching environment' + (data.version === 'latest' ? ': continuing for more recent release' : ''), '\x1b[0m');
                        return data.version === 'latest';
                    }
                    else{
                        console.log(asset.name, '\x1b[31m', 'not matching environment' ,'\x1b[0m');
                        return true;
                    }
                });
                
                console.log('');

                if (!candidate) {
                    reject('No WebChimera release found matching your environment');
                }

                console.log('Acquiring: ', candidate.name);
                
                var dir = './bin';
                try {
                    stats = fs.lstatSync(dir);
                    if (stats.isDirectory()) {
                        fs.removeSync(dir);
                    }
                }
                catch (e) { 
                    fs.mkdir(dir);
                }
                
                downloader.downloadAndUnpack(dir, candidate.browser_download_url)
                    .then(function() {
                        resolve(data)
                    });
            })
            .catch(reject)
    });
}

function parseEnv() {
    var supported = {
        runtimes: ['electron', 'nw.js'],
        platforms: ['osx', 'win', 'linux'],
        arch: ['ia32', 'x64']
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
        var targetDir = './bin';

        if (/^win/.test(platform))
            platform = 'win';
        else if (platform === 'darwin')
            platform = 'osx'
        if (manifest)
            if (parsePath(manifest.main).extname === '.html') {
                if (!process.env.WCJS_RUNTIME) runtime = 'nw.js';
            }

        console.log('Fetching WebChimera prebuilt for', capitalizeFirstLetter(runtime) + ':', '\nWebChimera version:', version, 
            '\n' + capitalizeFirstLetter(runtime) + ' version:', runtimeVersion, '\nPlatform:', platform, '\nArch:', arch);

        if (!(supported.runtimes.indexOf(runtime) > -1) || !(supported.platforms.indexOf(platform) > -1) || !(supported.arch.indexOf(arch) > -1))
            return reject('Unsupported runtime/arch/platform');

        resolve({
            runtime: {
                type: runtime,
                version: runtimeVersion,
                arch: arch,
                platform: platform
            },
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
                return reject('Something went very wrong: ' + (err || "no body!?!?!"));
            resolve(resp.body)
        });
    })
}

parseEnv()
    .then(getWCJS)
    .then(function() {
        console.log('WebChimera with VLC Libs downloaded');
    })
    .catch(function(e) {
        console.log(e.message || e);
        if (e.stack) console.log(e.stack);
        process.exit(1); // indicate to npm that we've quit badly
    })
