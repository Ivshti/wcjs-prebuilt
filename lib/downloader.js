var Promise = require('bluebird');
var request = require('request');
var progress = require('progress');
var fs = require('fs-extra');
var path = require('path');
var gunzip = require("gunzip-maybe");
var tar = require('tar-fs');
var temp = require('temp');
var DecompressZip = require('decompress-zip');

// Automatically track and cleanup files at exit
temp.track();
var isWin = /^win/.test(process.platform);

// one progressbar for all downloads
var bar;

module.exports = {
    clearProgressbar: function() {
        bar && bar.terminate();
        bar = null;
    },
    downloadAndUnpack: function(destination, url) {
        var cachepath = path.resolve(destination, './temp');
        fs.mkdirsSync(cachepath);
        var extention = path.extname(url),
            done = Promise.defer(),
            self = this,
            rq = request(url),
            len,
            stream;

        function format(statusCode) {
            return statusCode + ': ' + require('http').STATUS_CODES[statusCode];
        }

        rq.on('error', function(err) {
            bar && bar.terminate();
            done.reject(err);
        });
        rq.on('response', function(res) {
            len = parseInt(res.headers['content-length'], 10);
            if (res.statusCode !== 200) {
                done.reject({
                    statusCode: res.statusCode,
                    msg: 'Recieved status code ' + format(res.statusCode)
                });
            } else if (len) {
                if (!bar) {
                    bar = new progress('  downloading [:bar] :percent :etas', {
                        complete: '=',
                        incomplete: '-',
                        width: 20,
                        total: len
                    });
                } else {
                    bar.total += len;
                }
            }
        });
        rq.on('data', function(chunk) {
            len && bar && bar.tick(chunk.length);
        });

        if (extention === '.zip') {
            stream = temp.createWriteStream();

            stream.on('close', function() {
                if (done.promise.isRejected()) return;
                self.extractZip(stream.path, cachepath).then(self.stripRootFolder).then(function() {
                    self.moveExtractedFilesToDestination(cachepath, destination).then(function() {
                        done.resolve();
                    });
                });
            });

            rq.pipe(stream);
        }

        if (extention === '.gz') {
            rq.on('response', function(res) {
                if (res.statusCode !== 200) return;
                self.extractTar(res, cachepath).then(self.stripRootFolder).then(function() {
                    self.moveExtractedFilesToDestination(cachepath, destination).then(function() {
                        done.resolve();
                    });
                });
            });
        }

        return done.promise;
    },
    extractTar: function(tarstream, destination) {
        var done = Promise.defer(),
            files = [];

        tarstream
            .pipe(gunzip())
            .on('error', function(err) {
                done.reject(err);
            })
            .pipe(tar.extract(destination, {
                umask: (isWin ? false : 0),
                map: function(header) {
                    files.push({
                        path: path.basename(header.name)
                    });
                    return header;
                }
            }))
            .on('finish', function() {
                done.resolve({
                    files: files,
                    destination: destination
                });
            });

        return done.promise;
    },
    extractZip: function(zipfile, destination) {
        var files = [],
            done = Promise.defer();

        new DecompressZip(zipfile)
            .on('error', function(err) {
                done.reject(err);
            })
            .on('extract', function(log) {
                // Setup chmodSync to fix permissions
                files.forEach(function(file) {
                    fs.chmodSync(path.join(destination, file.path), file.mode);
                });

                done.resolve({
                    files: files,
                    destination: destination
                });
            })
            .extract({
                path: destination,
                filter: function(entry) {
                    files.push({
                        path: entry.path,
                        mode: entry.mode.toString(8)
                    });

                    return true;
                }
            });

        return done.promise;
    },
    stripRootFolder: function(extracted) {
        var done = Promise.defer(),
            extractionFolder = extracted.destination,
            rootFiles = fs.readdirSync(extractionFolder);

        // strip out root folder if it exists
        if (rootFiles.length === 1){
            var rootFolder = path.join(extractionFolder, rootFiles[0]);
            if(fs.statSync(rootFolder).isDirectory()) {
                // move stripped folder to destination
                fs.copy(rootFolder, extractionFolder, function(err) {
                    if (err) done.reject(err);
                    else fs.remove(rootFolder, function() {
                        done.resolve();
                    });
                });
            }
        } 
        else {
            done.resolve();
        }

        return done.promise;
    },
    moveExtractedFilesToDestination: function(cachepath, destination) {
        var done = Promise.defer();

        fs.copy(cachepath, destination, function(err) {
            if (err) done.reject(err);
            else fs.remove(cachepath, function() {
                done.resolve();
            });
        });

        return done.promise;
    }
};