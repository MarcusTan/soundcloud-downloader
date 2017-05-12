const client = require('node-soundcloud'),
      request = require('request');

// "1": {
//     "artwork": "https://i1.sndcdn.com/artworks-000081990659-co6704-t200x200.jpg",
//     "link": "/20syl/sets/20syl-ongoing-thing-feat",
//     "name": "20syl - Motifs - EP",
//     "uploader": "20syl"
// },
const getSetObj = (o, cb) => {
    client.get('/resolve', {
        url: 'https://soundcloud.com' + o.link
    }, (err, res) => {
        if (err) cb('resolve', err);
        if (!res.location) cb('resolve', new Error('No `location` found'));

        let ret = {};
        // console.log(res.location);
        request.get(res.location, (err, res, set) => {
            if (err) cb('get resolved url', err);
            set = JSON.parse(set);
            console.log(set.tracks.length);
            for (let i = 0; i < set.tracks.length; i++) {
                ret[i+1] = {
                    artwork: set.tracks[i].artwork_url,
                    link: set.tracks[i].permalink_url,
                    name: set.tracks[i].title,
                    uploader: set.tracks[i].user.username,
                    set: set.title,
                    type: set.playlist_type || set.type
                }
                // console.log(set.tracks[i].title);
            }
            // console.log(JSON.stringify(ret, null, 4));
        });
    });
}

module.exports = {
    client: client,
    getSetObj: getSetObj
}