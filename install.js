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
                        version: (data.runtime.version === 'latest') ? 'latest' : assetParsed[3],
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
                
                downloader.downloadAndUnpack(data.dir, candidate.browser_download_url)
                    .then(function() {
                        resolve(data)
                    });
            })
            .catch(reject)
    });
}

function cleanup() {
    return new Promise(function(resolve, reject) {
        // RSAtom's osx release includes a few files that cause problems
        // with build libs like Electron builder, and that are not needed
        // anyway so we can safely remove them:
        //     - a broken symlink to liblzma.5.dylib
        //       (Electron builder will break when trying to de-references it)
        //     - a bunch of ._* files
        //       (For some reason they cause codesigning problems)
        console.log('');
        console.log('Cleaning up - now looking for useless files to remove...');
        var filesToRemove = [
            './bin/lib/vlc/lib/liblzma.5.dylib',
            './bin/lib/vlc/share/lua/playlist/._pluzz.luac',
            './bin/lib/vlc/share/lua/playlist/._mpora.luac',
            './bin/lib/vlc/share/lua/playlist/._liveleak.luac',
            './bin/lib/vlc/share/lua/playlist/._youtube.luac',
            './bin/lib/vlc/share/lua/playlist/._googlevideo.luac',
            './bin/lib/vlc/share/lua/modules/._simplexml.luac',
            './bin/lib/vlc/share/lua/playlist/._anevia_streams.luac',
            './bin/lib/vlc/share/lua/playlist/._metacafe.luac',
            './bin/lib/vlc/share/lua/playlist/._koreus.luac',
            './bin/lib/vlc/share/lua/extensions/._VLSub.luac',
            './bin/lib/vlc/share/lua/playlist/._joox.luac',
            './bin/lib/vlc/share/lua/modules/._dkjson.luac',
            './bin/lib/vlc/share/lua/modules/._common.luac',
            './bin/lib/vlc/share/lua/playlist/._canalplus.luac',
            './bin/lib/vlc/share/lua/playlist/._vimeo.luac',
            './bin/lib/vlc/share/lua/playlist/._jamendo.luac',
            './bin/lib/vlc/share/lua/playlist/._extreme.luac',
            './bin/lib/vlc/share/lua/playlist/._metachannels.luac',
            './bin/lib/vlc/share/lua/playlist/._appletrailers.luac',
            './bin/lib/vlc/share/lua/playlist/._lelombrik.luac',
            './bin/lib/vlc/share/lua/playlist/._katsomo.luac',
            './bin/lib/vlc/share/lua/playlist/._soundcloud.luac',
            './bin/lib/vlc/share/lua/playlist/._zapiks.luac',
            './bin/lib/vlc/share/lua/playlist/._rockbox_fm_presets.luac',
            './bin/lib/vlc/share/lua/modules/._sandbox.luac',
            './bin/lib/vlc/share/lua/playlist/._bbc_co_uk.luac',
            './bin/lib/vlc/share/lua/playlist/._anevia_xml.luac',
            './bin/lib/vlc/share/lua/playlist/._cue.luac',
            './bin/lib/vlc/share/lua/playlist/._youtube_homepage.luac',
            './bin/lib/vlc/share/lua/playlist/._break.luac',
            './bin/lib/vlc/share/lua/playlist/._pinkbike.luac',
            './bin/lib/vlc/share/lua/playlist/._france2.luac',
            './bin/lib/vlc/share/lua/playlist/._dailymotion.luac',
            './bin/lib/vlc/plugins/._plugins.dat'
        ];
        var deleted = filesToRemove.map(function(path){
            return new Promise(function(res, rej) {
                fs.lstat(path, function(err, stat) {
                    if(err == null) {
                        fs.unlink(path);
                        console.log("Removed useless file:", path);
                    }
                    res();
                })
            })
        })
        Promise.all(deleted).then(function(){
            console.log('Done cleaning up.');
            console.log('');
            resolve();
        })
    });
}

function parseEnv() {
    var supported = {
        runtimes: ['electron', 'nw'],
        platforms: ['osx', 'win', 'linux'],
        arch: ['ia32', 'x64']
    }

    return new Promise(function(resolve, reject) {
        try {
            var manifest = require(path.join(rootdir, 'package.json'));
        } catch (e) {};

        var inf = (manifest && manifest['wcjs-prebuilt']) ? manifest['wcjs-prebuilt'] : {};

        var platform = process.env.WCJS_PLATFORM || inf.platform || getPlatformInfo().split(':')[0];
        var arch = process.env.WCJS_ARCH || inf.arch || getPlatformInfo().split(':')[1];
        var version = process.env.WCJS_VERSION || inf.version || 'latest';
        var runtime = process.env.WCJS_RUNTIME || inf.runtime || 'electron';
        var runtimeVersion = process.env.WCJS_RUNTIME_VERSION || inf.runtimeVersion || 'latest';
        var targetDir = process.env.WCJS_TARGET_DIR || inf.targetDir || './bin';
        
        fs.mkdirsSync(targetDir);

        if (/^win/.test(platform))
            platform = 'win';
        else if (platform === 'darwin')
            platform = 'osx'
        if (manifest)
            if (parsePath(manifest.main).extname === '.html') {
                if (!process.env.WCJS_RUNTIME && !inf.runtime) runtime = 'nw';
            }

        console.log('Fetching WebChimera prebuilt for', capitalizeFirstLetter(runtime) + ':', '\nWebChimera version:', version, 
            '\n' + capitalizeFirstLetter(runtime) + ' version:', runtimeVersion, '\nPlatform:', platform, '\nArch:', arch,
            '\nTarget dir:', targetDir);

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
                return reject('Something went very wrong: ' + (err || "no body!?!?!"));
            resolve(resp.body)
        });
    })
}

parseEnv()
    .then(getWCJS)
    .then(cleanup)
    .then(function() {
        console.log('WebChimera with VLC Libs downloaded');
    })
    .catch(function(e) {
        console.log(e.message || e);
        if (e.stack) console.log(e.stack);
        process.exit(1); // indicate to npm that we've quit badly
    })