"use strict";
var system = require('system');
var page = require('webpage').create();
var fs = require('fs');
var requestUrl = system.args[1];

page.open(requestUrl, function(status) {
    // page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js', function() {
    //     page.evaluate(function(phantom) {
    //         console.log('clicking button');
    //         $('.l-listen-hero .fullListenHero .fullListenHero__foreground').trigger('mouseover');
    //     });
    // });
    // console.log(status);

    // wait 10 seconds, then exit
    window.setTimeout(function () {
        phantom.exit();
    }, 10000);
});

// page.onResourceRequested = function(requestData, networkRequest) {
//   if (requestData.url.indexOf("api") != -1) {
//         console.log('@@@@@@@@@@ ' + requestData.url);
//     }
// };

page.onResourceReceived = function(resource) {
    if (resource.url.indexOf("streams") != -1 && resource.stage == "end") {
        console.log('RESOURCE' + resource.url);
        phantom.exit();
    }
};
