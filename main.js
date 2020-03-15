#!/usr/bin/env node

import {
    GenCSV
} from './GenCSV';
import {
    FindSongs
} from './FindSongs';
import {
    CreatePlaylists
} from './CreatePlaylists';
import {
    UploadPlaylists
} from './UploadPlaylists';
import {
    Authenticate
} from './Authenticate';
const yargs = require('yargs');

const argv = yargs
    .command('auth', 'Authenticate to Spotify.')
    .command('gencsv', 'Generate a CSV file from a local directory.', {
        dir: {
            description: 'The input directory.',
            alias: 'd',
            type: 'string',
            demandOption: true
        },
        out: {
            description: 'The output CSV file.',
            alias: 'o',
            type: 'string',
            demandOption: true
        },
        limit: {
            description: 'Maximum number of files to process.',
            alias: 'l',
            type: 'number'
        }
    })
    .command('findsongs', 'Find local songs on spotify.', {
        csv: {
            description: 'The input CSV file.',
            alias: 'i',
            type: 'string',
            demandOption: true
        },
        out: {
            description: 'The output CSV file.',
            alias: 'o',
            type: 'string',
            demandOption: true
        },
        limit: {
            description: 'Maximum number of songs to process.',
            alias: 'l',
            type: 'number'
        }
    })
    .command('createplaylists', 'Create playlists from the local songs.', {
        csv: {
            description: 'The input CSV file.',
            alias: 'i',
            type: 'string',
            demandOption: true
        },
        out: {
            description: 'The output CSV file.',
            alias: 'o',
            type: 'string',
            demandOption: true
        },
        limit: {
            description: 'Maximum number of songs to process.',
            alias: 'l',
            type: 'number'
        }
    })
    .command('uploadplaylists', 'Upload playlists to Spotify.', {
        csv: {
            description: 'The input CSV file.',
            alias: 'i',
            type: 'string',
            demandOption: true
        },
        out: {
            description: 'The output CSV file.',
            alias: 'o',
            type: 'string',
            demandOption: true
        },
        limit: {
            description: 'Maximum number of files to process.',
            alias: 'l',
            type: 'number'
        }
    })
    .demandCommand(1, 'You need to specify a command.')
    .help().alias('help', 'h')
    .argv;

if (argv._.includes('auth')) {
    new Authenticate().auth();
} else if (argv._.includes('gencsv')) {
    new GenCSV(argv.dir, argv.out).generate(argv.limit);
} else if (argv._.includes('findsongs')) {
    new FindSongs(argv.csv, argv.out).find(argv.limit);
} else if (argv._.includes('createplaylists')) {
    new CreatePlaylists(argv.csv, argv.out).create(argv.limit);
} else if (argv._.includes('uploadplaylists')) {
    new UploadPlaylists(argv.csv, argv.out).upload(argv.limit);
}