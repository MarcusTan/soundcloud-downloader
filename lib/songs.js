const fs = require('fs'),
      path = require('path'),
      request = require('request'),
    //   phantom = require('phantomjs-prebuilt'),
      slimer = require('slimerjs'),
      childProcess = require('child_process'),
      scrapeMp3Script = path.join(__dirname, 'scrapeMp3.js'),
      ffmetadata = require("ffmetadata"),
      colors = require('colors'),
      async = require('async'),
      sanitize = require("sanitize-filename"),
      helpers = require('./helpers'),
      artExt = '.jpg',
      songExt = '.mp3',
      limitOperations = 1;
let failed = {}, skipped = {};
let fi = 0, si = 0, numberProcessed = 0, numberDownloaded = 0, totalSongs;

// optional: download sets
const downloadStream = (dlSetsFlag, songs, artFolder, songsFolder) => {
    // For each key in the JSON...
    console.log('Beginning to Download Songs from Stream')
    totalSongs = calculateTotalSongs(songs);
    async.forEachLimit(songs, limitOperations, function(song, cb) {
        const isSet = song.link.split('/')[2] === 'sets',
              artPath = path.resolve(__dirname, '../', songsFolder, artFolder, sanitize(song.name + artExt)),
              songPath = path.resolve(__dirname, '../', songsFolder, sanitize(song.name + songExt)),
              songInfo = song.name + ' by ' + song.uploader,
              skippedMsg = '[SKIPPED]\t' + songInfo;
        if (isSet) {
            if (dlSetsFlag) {
                downloadSet(song);
            } else {
                console.log(colors.blue(skippedMsg + '\t - it\'s a set'));
                skipped[si++] = song;
                numberProcessed += song.tracks.length;
                cb();
            }
        } else {
            fs.access(songPath, fs.F_OK, (err) => {
                numberProcessed++;
                if (err && err.code === 'ENOENT') {
                    downloadSong(song, artPath, songPath, (stage, err) => {
                        const msg = '[' + stage.toUpperCase() + ']\t' + songInfo;
                        if (err) {
                            console.log(colors.red(msg));
                            console.error(colors.red(err.message || 'No error message available'));
                            failed[fi++] = song;
                            cb();
                        } else {
                            console.log(colors.green(msg));
                            numberDownloaded++;
                            cb();
                        }
                    });
                } else {
                    console.log(colors.blue(skippedMsg + '\t - song already exists!'));
                    skipped[si++] = song;
                    cb();
                }
            });
        }
    }, function (err) {
        if (err) {
            console.error(err);
        }
        if (numberProcessed >= totalSongs) {
            console.log('---------- SCRIPT FINISHED ----------');
            console.log('Of ' + numberProcessed + ' total songs, ' + colors.green(numberDownloaded) + ' were downloaded')
            if (Object.keys(skipped).length != 0) {
                const skippedPath = path.resolve(__dirname, '../', 'skipped.json');
                let totalNumSkipped = 0;
                console.log(colors.blue('SKIPPED:'));
                Object.keys(skipped).forEach(k => {
                    let numSkipped = (skipped[k].tracks && skipped[k].tracks.length)?(skipped[k].tracks.length):(1);
                    totalNumSkipped += numSkipped;
                    console.log(colors.blue('\t[' + numSkipped + '] - ' + skipped[k].name + ' by ' + skipped[k].uploader));
                });
                console.log(colors.blue('\tTotal Skipped: ' + totalNumSkipped));
                fs.writeFile(skippedPath, JSON.stringify(skipped, null, 4), (err) => {
                    if (err) throw err;
                    console.log('Saved `skipped` to json');
                });
            }
            if (Object.keys(failed).length != 0) {
                const failedPath = path.resolve(__dirname, '../', 'failed.json');
                let totalNumFailed = 0;
                console.log(colors.red('FAILED:'));
                Object.keys(failed).forEach(k => {
                    let numFailed = (failed[k].tracks && failed[k].tracks.length)?(failed[k].tracks.length):(1);
                    totalNumFailed += numFailed;
                    console.log(colors.red('\t[' + numFailed + '] - ' + failed[k].name + ' by ' + failed[k].uploader));
                });
                console.log(colors.red('\tTotal Failed: ' + totalNumFailed));                
                fs.writeFile(failedPath, JSON.stringify(failed, null, 4), (err) => {
                    if (err) throw err;
                    console.log('Saved `failed` to json');
                });
            }
        }
    });
}

const calculateTotalSongs = (songs) => {
    let count = 0;
    Object.keys(songs).forEach(k => {
        if (songs[k].tracks && songs[k].tracks.length) {
            count += songs[k].tracks.length;
        } else {
            count++;
        }
    });
    return count;
}

const getMp3Url = (requestUrl, cb) => {
    const childArgs = [scrapeMp3Script, requestUrl];
    let ret;
    childProcess.execFile(slimer.path, childArgs, function(err, stdout, stderr) {
        const identifier = 'RESOURCE';
        async.forEach(stdout.split('\n'), (line, cb) => {
            if (line.startsWith(identifier)) {
                request(line.slice(identifier.length), (err, res, body) => {
                    if (err) {
                        cb(err);
                    } else {
                        ret = JSON.parse(body).http_mp3_128_url;
                        cb();
                    }
                });
            } else {
                cb();
            }
        }, (err) => {
            if (err) return cb(err, null);
            else if (!ret) return cb(new Error('could not get mp3 url'), null);
            else return cb(null, ret);
        });
    });
}

// "0": {
//     "artwork": "https://i1.sndcdn.com/artworks-000093769060-1f3dp0-t200x200.jpg",
//     "link": "/freddyolo/museum-97",
//     "name": "museum '97",
//     "uploader": "フレッドYOLO"
// }
const downloadSong = (song, artPath, songPath, cb) => {
    // get download link
    const requestUrl = 'https://soundcloud.com' + song.link;
    getMp3Url(requestUrl, function (err, downloadUrl) {
        if (err) {
            cb('scraping mp3 url', err);
        } else {
            // get song
            request.get(downloadUrl).on('error', function(err) {
                if (err) cb('downloading song', err);
            }).pipe(fs.createWriteStream(songPath)).on('finish', function () {
                // get artwork, soundcloud will render 500x500 jpg's 
                // https://developers.soundcloud.com/docs/api/reference#tracks
                let songArr = song.artwork.split('-');
                songArr.splice(-1, 1, 't500x500.jpg');
                request.get(songArr.join('-')).on('error', function(err) {
                    if (err) cb('downloading artwork', err);
                }).pipe(fs.createWriteStream(artPath)).on('finish', function () {
                    // attach meta data
                    // ATTACH ALBUM INFO
                    const data = {
                        title: song.name,
                        artist: song.uploader
                    }
                    const options = {
                        attachments: [artPath]
                    };
                    ffmetadata.write(songPath, data, options, function(err) {
                        if (err) cb('attaching meta-data', err);
                        else cb('success', null);
                    });
                });
            });
        }
    });
}

const downloadSet = (set) => {
    numberProcessed++;
    numberDownloaded++;
}


module.exports = {
    downloadStream: downloadStream,
    downloadSong: downloadSong,
    downloadSet: downloadSet
}