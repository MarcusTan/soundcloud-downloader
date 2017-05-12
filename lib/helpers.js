const fs = require('fs'),
      path = require('path'),
      mkdirp = require('mkdirp'),
      colors = require('colors');

const loadJSON = (args, cb) => {
    if (args.length != 3) {
        console.log('please pass in the name of the json file'.red);
        cb(new Error('no json file'), null);
    }

    const filePath = path.resolve(__dirname, '../', args[2]);
    let data;
    try {
        console.log('Attempting to load JSON from: ' + filePath);
        // json parsing ʟᴜᴄᴀ ʟᴜsʜ
        data = fs.readFileSync(filePath).toString().replace(/&amp;/g,'&');
        data = JSON.parse(data);
    } catch (err) {
        console.log(err.message.red);
        cb(err, null)
    }

    console.log(JSON.stringify(data, null, 4));
    // console.log('JSON file successfully read'.green);
    // return cb(null, data);
}


const makeFolders = (artFolder, songsFolder, cb) => {
    // make songs folder
    mkdirp(path.resolve(__dirname, '../', songsFolder, artFolder), function (err) {
        if (err) {
            console.log(err.message.red);
            cb(err);
        } else {
            console.log(colors.green('made folders: ' + songsFolder + ' , ' + artFolder));
            cb();
        } 
    });
}

module.exports = {
    loadJSON: loadJSON,
    makeFolders: makeFolders
}