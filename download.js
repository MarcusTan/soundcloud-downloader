const helpers = require('./lib/helpers'),
    songs = require('./lib/songs');

// download for single: standalone
// download for sets: standalone + in
// download sets with playlist_type (https://developers.soundcloud.com/docs/api/reference#playlists) but wont download playlists compiled by others

const dlSetsFlag = false,
    artFolder = 'artwork',
    songsFolder = 'songDownloads';

helpers.loadJSON(process.argv, (err, data) => {
    if (err) process.exit(1);
    helpers.makeFolders(artFolder, songsFolder, (err) => {
        if (err) process.exit(1);
        songs.downloadStream(dlSetsFlag, data, artFolder, songsFolder);
    });
});