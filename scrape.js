'use strict';
var system = require('system');
var page = require('webpage').create();
var set = require('webpage').create();
var fs = require('fs');
var async = require('async');
var output = 'output.json';

var i = 0;
var ret;

function loopArray(keys) {
    scrapeSet(keys[i],function(){
        i++;
        if(i < keys.length) {
            loopArray(keys);
        } else {
            console.log('script finished');
            fs.write(output, JSON.stringify(ret, null, 4), {mode: 'w', charset: 'UTF-8'});
            phantom.exit(0);
        }
    }); 
}

function scrapeSet(k,cb) {
    if (ret[k].link.split('/')[2] === 'sets') {
        console.log(ret[k].link);
        setTimeout(function () {
            set.open('https://soundcloud.com' + ret[k].link, function(status) {
                console.log(status);

                var interval = window.setInterval(function() {
                    //  keep scrolling if: class='loading regular m-padded'
                    //  stop scrolling if: class='paging-eof sc-border-light-top'
                    var keepScrolling = set.content.match(/class="loading regular m-padded"/g);
                    var stopScrolling = set.content.match(/class="paging-eof sc-border-light-top"/g);

                    if (keepScrolling) {
                        console.log('scrolling');
                        set.evaluate(function() {
                            window.document.body.scrollTop = document.body.scrollHeight;
                        });
                    } else if (stopScrolling) {
                        clearInterval(interval);
                            ret[k].tracks = set.evaluate(function() {
                                var isReady = setInterval(function() {
                                    console.log('waiting for set DOM to load...');
                                    if (document.readyState === "complete") {
                                        clearInterval(isReady);
                                        getSetSongs();
                                    }
                                }, 1000);
                                function getSetSongs() {
                                    var songs = document.querySelectorAll('#content .l-listen-wrapper .trackList .trackList__list .trackList__item .trackItem');
                                    var songsArr = [];
                                    for (i = 0; i < songs.length; i++) {
                                        var doc = document.createElement('html');
                                        doc.innerHTML = '<html><head></head><body>' + songs[i].innerHTML + '</body></html>';
                                        songsArr.push({
                                            name: doc.querySelector('.trackItem__content a.trackItem__trackTitle').innerText,
                                            artwork: doc.querySelector('.trackItem__image .image span').style.backgroundImage.slice(4, -1),
                                            link: doc.querySelector('.trackItem__content a.trackItem__trackTitle').getAttribute('href'),
                                            uploader: doc.querySelector('.trackItem__content a.sc-link-light').innerText,
                                            number: doc.querySelector('.trackItem__numberWrapper span').innerText
                                        });
                                    }
                                    return songsArr;
                                }
                            }); 
                            cb();
                    } else {
                        console.log('scrolling');        
                        set.evaluate(function() {
                            window.document.body.scrollTop = document.body.scrollHeight;
                        });
                    }
                }, 1000);

            });
        }, 5000);
    } else {
        cb();
    }
}

if (system.args.length != 2) {
    console.log('please enter the soundcloud url');
    phantom.exit();
}

page.onConsoleMessage = function(msg) {
  console.log(msg);
}

page.open(system.args[1], function (status) {
    var interval = window.setInterval(function() {
        //  keep scrolling if: class='loading regular m-padded'
        //  stop scrolling if: class='paging-eof sc-border-light-top'
        var keepScrolling = page.content.match(/class="loading regular m-padded"/g);
        var stopScrolling = page.content.match(/class="paging-eof sc-border-light-top"/g);
        // var keepScrolling = false;
        // var stopScrolling = true;

        if (keepScrolling) {
            console.log('scrolling');
            page.evaluate(function() {
                window.document.body.scrollTop = document.body.scrollHeight;
            });
        } else if (stopScrolling) {
            clearInterval(interval);
            ret = page.evaluate(function() {
                var isReady = setInterval(function() {
                    console.log('waiting for DOM to load...');
                    if (document.readyState === "complete") {
                        clearInterval(isReady);
                        getSongs();
                    }
                }, 1000);
                function getSongs() {
                    console.log('GETTING SONGS');
                    var songs = document.querySelectorAll('.userStreamItem .sound__body');
                    var songsObj = {};
                    for (i = 0; i < songs.length; i++) {
                        var doc = document.createElement('html');
                        doc.innerHTML = '<html><head></head><body>' + songs[i].innerHTML + '</body></html>';
                        songsObj[i] = {
                            name: doc.querySelector('.sound__header .soundTitle__usernameTitleContainer .soundTitle__title span').innerText,
                            artwork: doc.querySelector('.sound__coverArt .image span').style.backgroundImage.slice(4, -1),
                            link: doc.querySelector('.sound__header .soundTitle__usernameTitleContainer .soundTitle__title').getAttribute('href').split('?')[0],
                            uploader: doc.querySelector('.sound__header .soundTitle__usernameTitleContainer .soundTitle__usernameText').innerText
                        };
                    }
                    return songsObj;
                }
            });
            
            var keys = Object.keys(ret);
            loopArray(keys);
        } else {
            console.log('scrolling');
            page.evaluate(function() {
                window.document.body.scrollTop = document.body.scrollHeight;
            });
        }
    }, 1000);
});