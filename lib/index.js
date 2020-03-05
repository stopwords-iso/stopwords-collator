/* eslint no-param-reassign: "off", no-sync: "off" */
'use strict';

const Fs = require('fs');
const Log = require('itlog');
const Path = require('path');
const Bossy = require('@hapi/bossy');

const internals = {
    codes: ['ab', 'aa', 'af', 'ak', 'sq', 'am', 'ar', 'an', 'hy', 'as', 'av', 'ae', 'ay', 'az', 'bm', 'ba', 'eu', 'be', 'bn', 'bh', 'bi', 'bs', 'br', 'bg', 'my', 'ca', 'ch', 'ce', 'ny', 'zh', 'cv', 'kw', 'co', 'cr', 'hr', 'cs', 'da', 'dv', 'nl', 'dz', 'en', 'eo', 'et', 'ee', 'fo', 'fj', 'fi', 'fr', 'ff', 'gl', 'ka', 'de', 'el', 'gn', 'gu', 'ht', 'ha', 'he', 'hz', 'hi', 'ho', 'hu', 'ia', 'id', 'ie', 'ga', 'ig', 'ik', 'io', 'is', 'it', 'iu', 'ja', 'jv', 'kl', 'kn', 'kr', 'ks', 'kk', 'km', 'ki', 'rw', 'ky', 'kv', 'kg', 'ko', 'ku', 'kj', 'la', 'lb', 'lg', 'li', 'ln', 'lo', 'lt', 'lu', 'lv', 'gv', 'mk', 'mg', 'ms', 'ml', 'mt', 'mi', 'mr', 'mh', 'mn', 'na', 'nv', 'nd', 'ne', 'ng', 'nb', 'nn', 'no', 'ii', 'nr', 'oc', 'oj', 'cu', 'om', 'or', 'os', 'pa', 'pi', 'fa', 'pl', 'ps', 'pt', 'qu', 'rm', 'rn', 'ro', 'ru', 'sa', 'sc', 'sd', 'se', 'sm', 'sg', 'sr', 'gd', 'sn', 'si', 'sk', 'sl', 'so', 'st', 'es', 'su', 'sw', 'ss', 'sv', 'ta', 'te', 'tg', 'th', 'ti', 'bo', 'tk', 'tl', 'tn', 'to', 'tr', 'ts', 'tt', 'tw', 'ty', 'ug', 'uk', 'ur', 'uz', 've', 'vi', 'vo', 'wa', 'cy', 'wo', 'fy', 'xh', 'yi', 'yo', 'za', 'zu'],
    stopwords: [],
    validExts: ['.txt'],
    definition: {
        h: {
            description: 'Show help',
            alias: 'help',
            type: 'boolean'
        },
        i: {
            description: 'Compile all languagges',
            alias: 'iso',
            type: 'boolean'
        },
        o: {
            description: 'Filename and path to output file',
            alias: 'output'
        },
        s: {
            description: 'Directory of the stopwords text files (.txt)',
            alias: 'source'
        }
    },
    uniq: (value, index, self) => {

        return self.indexOf(value) === index;
    }
};

exports.start = function (options) {

    internals.args = Bossy.parse(internals.definition, { argv: options.args });

    if (internals.args.i) {
        internals.stopwords = {};

        for (let i = 0; i < internals.codes.length; ++i) {
            const module = `stopwords-${ internals.codes[i] }`;
            try {
                internals.stopwords[internals.codes[i]] = require(module);
            }
            catch (e) {
                Log(`:: module not found - ${ module }`);
            }
        }

        try {
            Fs.writeFileSync('stopwords-iso.json', JSON.stringify(internals.stopwords));
        }
        catch (err) {

            return Log(`:: saving json error - ${ err.message }`);
        }

        return Log(':: collation complete');
    }

    if (internals.args.h || !internals.args.s || !internals.args.o) {

        return Log(Bossy.usage(internals.definition, 'stopwords-collator -s <path> -o <outfile>'));
    }

    let files = null;
    try {
        files = Fs.readdirSync(internals.args.source);
    }
    catch (err) {

        return Log(`:: directory error - ${ err.message }`);
    }

    const validFiles = [];
    for (let i = 0; i < files.length; ++i) {
        const fileExt = Path.extname(files[i]).toLowerCase();
        if (internals.validExts.indexOf(fileExt) > -1) {
            validFiles.push(files[i]);
        }
    }

    Log(`:: ${ validFiles.length } valid file/s found.`);

    for (let i = 0; i < validFiles.length; ++i) {
        const file = validFiles[i];

        Log(`:: reading ${ file }...`);

        let stopwords = null;
        try {
            stopwords = Fs.readFileSync(`${ internals.args.source }/${ file }`, 'utf8');
        }
        catch (err) {

            return Log(`:: file error - ${ err.message }`);
        }

        Log(`:: processing ${ file }...`);
        // remove CRs
        stopwords = stopwords.replace(/\r/g, '');
        // remove BOMs
        stopwords = stopwords.replace(/^\uFEFF/g, '');
        // split per line
        stopwords = stopwords.split('\n');
        // remove duplicates
        stopwords = stopwords.filter(internals.uniq);

        for (let j = 0; j < stopwords.length; ++j) {
            const stopword = stopwords[j].trim().toLowerCase();
            if (stopword && !stopword.startsWith('#')) {
                let tabbed = stopword.split('\t');
                if (tabbed.length > 1) {
                    tabbed = tabbed.filter(internals.uniq);
                    for (let k = 0; k < tabbed.length; ++k) {
                        const word = tabbed[k].trim().toLowerCase();
                        internals.stopwords.push(word);
                    }
                }
                else {
                    internals.stopwords.push(stopword);
                }
            }
        }
    }

    internals.stopwords = internals.stopwords.filter(internals.uniq).sort();

    try {
        Fs.writeFileSync(`${ internals.args.output }.txt`, internals.stopwords.join('\n'));
    }
    catch (err) {

        return Log(`:: saving txt error - ${ err.message }`);
    }

    try {
        Fs.writeFileSync(`${ internals.args.output }.json`, JSON.stringify(internals.stopwords));
    }
    catch (err) {

        return Log(`:: saving json error - ${ err.message }`);
    }

    Log(':: collation complete');
};
