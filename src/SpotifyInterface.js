const creds = require('./spotify-credentials');
const SpotifyWebApi = require('spotify-web-api-node');

class SpotifyInterface {
    constructor() {
        this._api = new SpotifyWebApi(creds);

        this._nextRequestAfter = Date.now();
        this._pollTimeout = 100;
        this._reqsPerSec = 5;
    }

    getAuthURL() {
        return this._api.createAuthorizeURL(["playlist-read-private", "playlist-modify-private"]);
    }

    getAccessTokensWithAuthToken(token) {
        return this._api.authorizationCodeGrant(token)
            .then((data) => {
                return {
                    accessToken: data.body['access_token'],
                    refreshToken: data.body['refresh_token']
                };
            });
    }

    auth() {
        const that = this;
        return this._api.refreshAccessToken()
            .then((data) => {
                // console.log('The access token expires in ' + data.body['expires_in']);
                // console.log('The access token is ' + data.body['access_token']);
                // console.log('The refresh token is ' + data.body['refresh_token']);

                // Save the access token so that it's used in future calls
                return that._api.setAccessToken(data.body['access_token']);
            })
            .catch((err) => {
                console.log('Something went wrong when retrieving an access token', err);
            });
    }

    _wrapReq(reqFunc) {
        return new Promise((resolve, reject) => {
            const send = () => {
                if (Date.now() < this._nextRequestAfter) {
                    setTimeout(send, this._pollTimeout);
                } else {
                    this._nextRequestAfter = Date.now() + (1000 / this._reqsPerSec);
                    reqFunc()
                        .then((resp) => {
                            if (resp.statusCode >= 200 < 300) {
                                this._rateLimited = null;
                                resolve(resp);
                            } else if (resp.statusCode == 429) {
                                // Rate limited; figure out when we can send the next request.
                                this._nextRequestAfter = Date.now() + Math.max(this._rateLimited || 0, Number(resp.headers["retry-after"]));
                                setTimeout(send, this._pollTimeout);
                            } else {
                                reject('Invalid status code ' + resp.statusCode);
                            }
                        })
                        .catch((ex) => {
                            resolve();
                        });
                }
            };

            send();
        });
    }

    findSong(artist, album, track) {
        let query = '';
        if (artist && artist.trim() != '') {
            query += `artist:${artist.replace("_", " ")} `;
        }
        if (album && album.trim() != '') {
            query += `album:${album.replace("_", " ")} `;
        }
        if (track && track.trim() != '') {
            query += `track:${track.replace("_", " ")} `;
        }
        if (query == '') {
            throw 'No search criteria provided.';
        }

        console.log('query: ' + query);
        return this._wrapReq(() => {
                return this._api.searchTracks(query);
            })
            .then((resp) => {
                console.log('completed query: ' + query);
                if (resp && resp.body && resp.body.tracks && resp.body.tracks.items) {
                    return resp.body.tracks.items;
                }
            });
    }

    createPlaylist(name) {
        console.log('create playlist: ' + name);
        return this._wrapReq(() => {
                return this._api.createPlaylist(creds.username, name, {
                    public: false
                });
            })
            .then((resp) => {
                return resp.body.id;
            });
    }

    removeTracks(id, tracks) {
        return this._wrapReq(() => {
                return this._api.removeTracksFromPlaylist(id, tracks);
            })
            .then((resp) => {
                return true;
            });
    }

    addTracks(id, tracks) {
        return this._wrapReq(() => {
                return this._api.addTracksToPlaylist(id, tracks);
            })
            .then((resp) => {
                return true;
            });
    }
}

export {
    SpotifyInterface
};