const fs = require('fs');
const path = require('path');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const CsvReadableStream = require('csv-reader');

class CreatePlaylists {
    constructor(csv, out) {
        this.csv = csv;
        this.out = out;
    }

    async create(limit) {
        this.playlists = new Map();

        if (limit) {
            limit = Number(limit);
        }

        const inputStream = fs.createReadStream(this.csv, {
            encoding: 'utf8',
            emitClose: true
        });

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
                let record = {
                    playlistid: '',
                    playlistname: '',
                    genre: '',
                    artist: '',
                    album: '',
                    track: '',
                    song: '',
                    spotifyuri: '',
                    spotifyplaylisturi: ''
                };

                if (row.length == 10) {
                    record.genre = row[1];
                    record.artist = row[2];
                    record.album = row[3];
                    record.track = row[4];
                    record.song = row[5];
                    record.spotifyuri = row[9];
                } else {
                    record.playlistid = row[0];
                    record.playlistname = row[1];
                    record.genre = row[2];
                    record.artist = row[3];
                    record.album = row[4];
                    record.track = row[5];
                    record.song = row[6];
                    record.spotifyuri = row[7];
                    record.spotifyplaylisturi = row[8];
                }

                if (record.spotifyuri) {
                    const playlistID = record.playlistid || (record.genre + "-" + record.artist + "-" + record.album);
                    const playlist = this.playlists.get(playlistID) || [];
                    playlist.push({
                        playlistid: playlistID,
                        playlistname: record.genre + '-' + record.artist + (record.album && record.album.trim() != '' ? '-' + record.album : ''),
                        artist: record.artist,
                        album: record.album,
                        track: record.track,
                        song: record.song,
                        spotifyuri: record.spotifyuri,
                        spotifyplaylisturi: record.spotifyplaylisturi || ''
                    });
                    this.playlists.set(playlistID, playlist);
                }
            })
            .on('end', () => {
                const csvStringifier = createCsvStringifier({
                    header: [{
                            id: 'playlistid',
                            title: 'Playlist ID'
                        }, {
                            id: 'playlistname',
                            title: 'Playlist Name'
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
                            id: 'spotifyuri',
                            title: 'Spotify URI'
                        },
                        {
                            id: 'spotifyplaylistid',
                            title: 'Spotify Playlist ID'
                        }
                    ]
                });
                const outStream = fs.createWriteStream(this.out);
                outStream.write(csvStringifier.getHeaderString());

                for (let value of this.playlists.values()) {
                    value.forEach((row) => {
                        outStream.write(csvStringifier.stringifyRecords([row]));
                    });
                }
                outStream.end();
                console.log('Complete!');
            });
    }
}

export {
    CreatePlaylists
};