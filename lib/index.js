'use strict';

const Fs = require('fs');
const Path = require('path');
const Bossy = require('bossy');
const Items = require('items');
const log = require('itlog');

const internals = {
    stopwords: [],
    validExts: ['.txt'],
    definition: {
        h: {
            description: 'Show help',
            alias: 'help',
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
    }
};

exports.start = function (options) {

    internals.args = Bossy.parse(internals.definition, { argv: options.args });

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
                            tabbed = [...new Set(tabbed)];
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

            internals.stopwords = internals.stopwords.filter(internals.uniq).sort();

            Fs.writeFile(`${internals.args.output}.txt`, internals.stopwords.join('\n'), (err) => {

                if (err) {

                    return log(`:: saving txt error - ${err.message}`);
                }

                Fs.writeFile(`${internals.args.output}.json`, JSON.stringify(internals.stopwords), (err) => {

                    if (err) {

                        return log(`:: saving json error - ${err.message}`);
                    }

                    log(':: collation complete');
                });
            });
        });
    });
};
