const fs = require('fs');
const path = require('path');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const CsvReadableStream = require('csv-reader');
const {
    SpotifyInterface
} = require('./SpotifyInterface');

class FindSongs {
    constructor(csv, out) {
        this.csv = csv;
        this.out = out;
        this.spotify = new SpotifyInterface();
    }

    findSong(localSong) {
        return this.spotify.findSong(localSong.artist, localSong.album, localSong.song)
            .then((tracks) => {
                if (tracks) {
                    const track = tracks[0];
                    return track;
                }
            });
    }

    async find(limit) {
        if (limit) {
            limit = Number(limit);
        }

        const inputStream = fs.createReadStream(this.csv, {
            encoding: 'utf8',
            emitClose: true
        });

        const csvStringifier = createCsvStringifier({
            header: [{
                    id: 'path',
                    title: 'Path'
                },
                {
                    id: 'genre',
                    title: 'Genre'
                },
                {
                    id: 'artist',
                    title: 'Artist'
                },
                {
                    id: 'album',
                    title: 'Album'
                },
                {
                    id: 'track',
                    title: 'Track'
                },
                {
                    id: 'song',
                    title: 'Song'
                },
                {
                    id: 'spotifyartist',
                    title: 'SpotifyArtist'
                },
                {
                    id: 'spotifyalbum',
                    title: 'SpotifyAlbum'
                },
                {
                    id: 'spotifytrack',
                    title: 'SpotifyTrack'
                },
                {
                    id: 'spotifyuri',
                    title: 'SpotifyURI'
                }
            ]
        });
        const outStream = fs.createWriteStream(this.out);
        outStream.write(csvStringifier.getHeaderString());

        const that = this;
        const promises = [];

        this.spotify.auth()
            .then(() => {
                let count = 0;

                inputStream
                    .pipe(CsvReadableStream({
                        skipHeader: true,
                        parseNumbers: true,
                        parseBooleans: true,
                        trim: true
                    }))
                    .on('data', async (row) => {
                        if (limit && count >= limit) {
                            return;
                        }

                        count++;
                        const record = {
                            path: row[0],
                            genre: row[1],
                            artist: row[2],
                            album: row[3],
                            track: row[4],
                            song: row[5],
                            spotifyartist: row[6] || '',
                            spotifyalbum: row[7] || '',
                            spotifytrack: row[8] || '',
                            spotifyuri: row[9] || '',
                        };

                        if (record.spotifyuri != '') {
                            outStream.write(csvStringifier.stringifyRecords([record]));
                        } else {
                            promises.push(that.findSong(record)
                                .then((track) => {
                                    if (track) {
                                        record.spotifyartist = track.artists[0].name;
                                        record.spotifyalbum = track.album.name;
                                        record.spotifytrack = track.name;
                                        record.spotifyuri = track.uri;
                                    }
                                    outStream.write(csvStringifier.stringifyRecords([record]));
                                })
                                .catch((ex) => {
                                    console.error('Error finding track: ' + ex);
                                    outStream.write(csvStringifier.stringifyRecords([record]));
                                }));
                        }
                    })
                    .on('end', () => {
                        Promise.all(promises)
                            .then(() => {
                                outStream.end();
                                console.log('Complete!');
                            });
                    });
            });
    }
}

export {
    FindSongs
};