const fs = require('fs');
const path = require('path');
const {
    SpotifyInterface
} = require('./SpotifyInterface');
const readline = require("readline");

class Authenticate {
    constructor() {
        this.spotify = new SpotifyInterface();
    }

    async auth() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        const url = this.spotify.getAuthURL();
        rl.question('Go here, give permission, then enter the code in the URL: ' + url + "\n", (token) => {
            this.spotify.getAccessTokensWithAuthToken(token)
                .then((data) => {
                    console.log('Add this to your spotify-credentials.json');
                    console.log(JSON.stringify(data, null, 4));
                    rl.close();
                    process.stdin.destroy();
                });
        });
    }
}

export {
    Authenticate
};