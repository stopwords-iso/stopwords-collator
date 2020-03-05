/* eslint no-tabs: "off" */
'use strict';

const Proxyquire = require('proxyquire');
const Code = require('@hapi/code');
const Lab = require('@hapi/lab');

const lab = exports.lab = Lab.script();
const beforeEach = lab.beforeEach;
const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const internals = { stub: { fs: {} } };

internals.stub.fs.readdirSync = function () {

    if (internals.readdirErr) {

        throw new Error(internals.readdirErr);
    }

    return internals.list;
};

internals.stub.fs.readFileSync = function () {

    if (internals.readFileErr) {

        throw new Error(internals.readFileErr);
    }

    return internals.content;
};

internals.stub.fs.writeFileSync = function (path, data) {

    internals.data.push(data);

    if (path.endsWith('.txt') && internals.writeFileTxtErr) {

        throw new Error(internals.writeFileTxtErr);
    }

    if (path.endsWith('.json') && internals.writeFileJsonErr) {

        throw new Error(internals.writeFileJsonErr);
    }
};

internals.stub.itlog = function (message) {

    internals.messages.push(message);
};

beforeEach(() => {

    internals.collator = Proxyquire('..', internals.stub);
    internals.readdirErr = null;
    internals.readFileErr = null;
    internals.writeFileTxtErr = null;
    internals.writeFileJsonErr = null;
    internals.list = ['filename.txt', 'filename.abc'];
    internals.data = [];
    internals.messages = [];
    internals.content = `
#
stopword
 b
 
d
c	a
    the
The
is	iS`;
});

describe('start()', () => {

    it('returns usage info on -h or missing -s and -o', () => {

        internals.collator.start({ args: ['-h'] });
        expect(internals.messages[0]).to.contain('Usage: stopwords-collator');
        internals.messages = [];

        internals.collator.start({ args: ['-s', 'source'] });
        expect(internals.messages[0]).to.contain('Usage: stopwords-collator');
        internals.messages = [];

        internals.collator.start({ args: ['-o', 'output'] });
        expect(internals.messages[0]).to.contain('Usage: stopwords-collator');
        internals.messages = [];
    });

    it('returns directory error', () => {

        internals.readdirErr = 'some error';
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[0]).to.contain(':: directory error -');
    });

    it('returns file error', () => {

        internals.readFileErr = 'some error';
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[2]).to.contain(':: file error -');
    });

    it('returns txt file error', () => {

        internals.writeFileTxtErr = 'some error';
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[3]).to.contain(':: saving txt error -');
    });

    it('returns json file error', () => {

        internals.writeFileJsonErr = 'some error';
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[3]).to.contain(':: saving json error -');

        internals.collator.start({ args: ['-i'] });
        expect(internals.messages[internals.messages.length - 1]).to.contain(':: saving json error -');
    });

    it('collates with -s and -o', () => {

        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });

        expect(internals.data[0]).to.equal('a\nb\nc\nd\nis\nstopword\nthe');
        expect(internals.data[1]).to.equal('["a","b","c","d","is","stopword","the"]');
        expect(internals.messages[internals.messages.length - 1]).to.equal(':: collation complete');
    });

    it('collates with -i', () => {

        internals.collator.start({ args: ['-i'] });
        expect(internals.messages[internals.messages.length - 1]).to.equal(':: collation complete');
    });
});
