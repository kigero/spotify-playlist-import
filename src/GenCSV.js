const fs = require('fs');
const path = require('path');
const createCsvStringifier = require('csv-writer').createObjectCsvStringifier;

class GenCSV {
    constructor(dir, out) {
        this.dir = dir;
        this.out = out;
    }

    traverse(dir, onFile) {
        const list = fs.readdirSync(dir);

        for (let file of list) {
            file = path.resolve(dir, file);
            const stat = fs.statSync(file);
            if (stat && stat.isDirectory()) {
                this.traverse(file, onFile);
            } else {
                if (!onFile(file)) {
                    return;
                }
            }
        };
    }

    async generate(limit) {
        if (limit) {
            limit = Number(limit);
        }

        let count = 0;
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
                }
            ]
        });

        const outStream = fs.createWriteStream(this.out);
        outStream.write(csvStringifier.getHeaderString());

        const onFile = (file) => {
            if (limit && count > limit) {
                return false;
            }

            // Strip off the leading directory.
            file = file.substring(this.dir.length);
            if (file.startsWith('/') || file.startsWith('\\')) {
                file = file.substring(1);
            }

            const fileLC = file.toLowerCase();
            if (!(fileLC.endsWith('.mp3') || fileLC.endsWith('.flac'))) {
                return true;
            }

            const record = {
                path: file,
                genre: '',
                artist: '',
                album: '',
                track: 0,
                song: ''
            };

            const sep = file.indexOf('/') >= 0 ? '/' : '\\';
            const bits = file.split(sep);

            // Last bit is always the song.
            record.song = bits[bits.length - 1];
            record.song = record.song.substring(0, record.song.lastIndexOf('.'));

            // If there is a number at the beginning of the song, parse it as the track number.
            const matches = record.song.match(/(\d*)[^a-zA-z]*([a-zA-Z]{1}).*/);
            if (matches) {
                record.song = record.song.substring(record.song.indexOf(matches[2]));
                record.track = Number(matches[1]);
            }

            // The rest depends on where in the hierarchy we are.
            switch (bits.length) {
                case 2:
                    record.genre = bits[0];
                    break;

                case 3:
                    record.genre = bits[0];
                    record.artist = bits[1];
                    record.album = bits[1];
                    break;

                case 4:
                    record.genre = bits[0];
                    record.artist = bits[1];
                    record.album = bits[2];
                    break;
            }

            outStream.write(csvStringifier.stringifyRecords([record]));

            count++;
            return true;
        };

        this.traverse(this.dir, onFile);

        outStream.end();

        console.log('Complete!');
    }
}

export {
    GenCSV
};