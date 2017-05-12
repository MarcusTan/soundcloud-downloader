Given a url to a soundcloud page, scrape.js scrapes the url to create an output.json logging the set of songs to be downloaded
Given a particular output.json, download.js downloads the set of songs, with metadata attached

1) phantom scrape.js <soundcloudurl> --> generates output.json
2) node download.js output.json --> downloads songs to songDownloads

Requires phantomJS (use the command line tool)
Dependency: FFmpeg or libav must be installed on the system. This module uses the ffmpeg command-line tool. (https://www.npmjs.com/package/ffmetadata)