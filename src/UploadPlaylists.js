const fs = require('fs');
const path = require('path');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;
const CsvReadableStream = require('csv-reader');
const {
    SpotifyInterface
} = require('./SpotifyInterface');

class UploadPlaylists {
    constructor(csv, out) {
        this.csv = csv;
        this.out = out;
        this.spotify = new SpotifyInterface();
    }

    updatePlaylists() {
        const promises = [];
        for (let playlist of this.playlists.values()) {
            let spotifyplaylisturi;
            let playlistName;
            const curTracks = [];
            playlist.sort((a, b) => {
                if (a.track) {
                    if (b.track) {
                        return a.track < b.track ? -1 : b.track < a.track ? 1 : 0;
                    } else {
                        return -1;
                    }
                } else if (b.track) {
                    return 1;
                }

                return 0;
            });

            for (let track of playlist) {
                if (track.spotifyplaylisturi) {
                    // Blatantly ignoring if multiple tracks have different playlist URIs.
                    spotifyplaylisturi = track.spotifyplaylisturi;
                }
                if (track.playlistname) {
                    // Blatantly ignoring if multiple tracks have different playlist names.
                    playlistName = track.playlistname;
                }

                curTracks.push(track.spotifyuri);
            }

            const promise = new Promise((resolve, reject) => {
                (spotifyplaylisturi ? this.spotify.removeTracks(spotifyplaylisturi, tracks) : this.spotify.createPlaylist(playlistName))
                .then((id) => {
                        if (!spotifyplaylisturi) {
                            for (let track of playlist) {
                                track.spotifyplaylisturi = id;
                            }
                            spotifyplaylisturi = id;
                        }
                        return this.spotify.addTracks(spotifyplaylisturi, curTracks);
                    })
                    .then(() => {
                        resolve();
                    })
                    .catch((ex) => {
                        reject(ex);
                    });
            });
            promises.push(promise);
        }
        return Promise.all(promises);
    }

    async upload(limit) {
        this.playlists = new Map();

        if (limit) {
            limit = Number(limit);
        }

        const inputStream = fs.createReadStream(this.csv, {
            encoding: 'utf8',
            emitClose: true
        });

        const that = this;

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
                        let record = {
                            playlistid: row[0],
                            playlistname: row[1],
                            artist: row[2],
                            album: row[3],
                            track: row[4],
                            song: row[5],
                            spotifyuri: row[6],
                            spotifyplaylisturi: row[7]
                        };

                        if (record.playlistid) {
                            const playlist = this.playlists.get(record.playlistid) || [];
                            playlist.push(record);
                            this.playlists.set(record.playlistid, playlist);
                        }
                    })
                    .on('end', () => {
                        that.updatePlaylists()
                            .then(() => {
                                console.log('writing');
                                const csvStringifier = createCsvStringifier({
                                    header: [{
                                            id: 'playlistid',
                                            title: 'Playlist ID'
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
                                            id: 'spotifyplaylisturi',
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
                            })
                            .catch((ex) => {
                                console.log("Caught error: " + ex);
                            });
                    });
            });
    }
}

export {
    UploadPlaylists
};