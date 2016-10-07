'use strict';

const Fs = require('fs');
const Path = require('path');
const Bossy = require('bossy');
const Items = require('items');
const log = require('itlog');

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
    uniq: function (value, index, self) {

        return self.indexOf(value) === index;
    },
    save: function (outname) {

        internals.stopwords = internals.stopwords.filter(internals.uniq).sort();

        Fs.writeFile(`${outname}.txt`, internals.stopwords.join('\n'), (err) => {

            if (err) {

                return log(`:: saving txt error - ${err.message}`);
            }

            Fs.writeFile(`${outname}.json`, JSON.stringify(internals.stopwords), (err) => {

                if (err) {

                    return log(`:: saving json error - ${err.message}`);
                }

                log(':: collation complete');
            });
        });
    }
};

exports.start = function (options) {

    internals.args = Bossy.parse(internals.definition, { argv: options.args });

    if (internals.args.i) {

        for (let i = 0; i < internals.codes.length; ++i) {
            const module = `stopwords-${internals.codes[i]}`;
            try {
                internals.stopwords = internals.stopwords.concat(require(module));
            }
            catch (e) {
                log(`:: module not found - ${module}`);
            }
        }

        return internals.save('stopwords-iso');
    }

    if (internals.args.h || !internals.args.s || !internals.args.o) {

        return log(Bossy.usage(internals.definition, 'stopwords-collator -s <path> -o <outfile>'));
    }

    Fs.readdir(internals.args.source, (err, files) => {

        if (err) {

            return log(`:: directory error - ${err.message}`);
        }

        const validFiles = [];
        for (let f = 0; f < files.length; ++f) {
            const fileExt = Path.extname(files[f]).toLowerCase();
            if (internals.validExts.indexOf(fileExt) > -1) {
                validFiles.push(files[f]);
            }
        }

        log(`:: ${validFiles.length} valid file/s found.`);
        Items.parallel(validFiles, (file, next) => {

            log(`:: reading ${file}...`);
            Fs.readFile(`${internals.args.source}/${file}`, 'utf8', (err, stopwords) => {

                if (err) {

                    return next(`:: file error - ${err.message}`);
                }

                log(`:: processing ${file}...`);
                // remove CRs
                stopwords = stopwords.replace(/\r/g, '');
                // remove BOMs
                stopwords = stopwords.replace(/^\uFEFF/g, '');
                // split per line
                stopwords = stopwords.split('\n');
                // remove duplicates
                stopwords = stopwords.filter(internals.uniq);

                for (let s = 0; s < stopwords.length; ++s) {
                    const stopword = stopwords[s].trim().toLowerCase();
                    if (stopword) {
                        let tabbed = stopword.split('\t');
                        if (tabbed.length > 1) {
                            tabbed = tabbed.filter(internals.uniq);
                            for (let t = 0; t < tabbed.length; ++t) {
                                const word = tabbed[t].trim().toLowerCase();
                                internals.stopwords.push(word);
                            }
                        }
                        else {
                            internals.stopwords.push(stopword);
                        }
                    }
                }

                return next();
            });
        }, (err) => {

            if (err) {

                return log(err);
            }

            internals.save(internals.args.output);
        });
    });
};
