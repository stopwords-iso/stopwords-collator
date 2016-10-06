'use strict';

var Proxyquire = require('proxyquire');
var Code = require('code');
var Lab = require('lab');

var lab = exports.lab = Lab.script();
var beforeEach = lab.beforeEach;
var describe = lab.describe;
var it = lab.it;
var expect = Code.expect;

var internals = { stub: { fs: {} } };

internals.stub.fs.readdir = function (path, next) {

    return next(internals.readdirErr, internals.list);
};

internals.stub.fs.readFile = function (path, encoding, next) {

    return next(internals.readFileErr, internals.content);
};

internals.stub.fs.writeFile = function (path, data, next) {

    internals.data.push(data);

    if (path.endsWith('.txt')) {

        return next(internals.writeFileTxtErr);
    }

    if (path.endsWith('.json')) {

        return next(internals.writeFileJsonErr);
    }
};

internals.stub.itlog = function (message) {

    internals.messages.push(message);

    return;
};

internals.collator = Proxyquire('..', internals.stub);

beforeEach((done) => {

    internals.readdirErr = null;
    internals.readFileErr = null;
    internals.writeFileTxtErr = null;
    internals.writeFileJsonErr = null;
    internals.list = ['filename.txt', 'filename.abc'];
    internals.data = [];
    internals.messages = [];
    internals.content = `
stopword
 b
 
d
c	a
    the
The
is	iS`;

    return done();
});

describe('start()', () => {

    it('returns usage info on -h or missing -s and -o', (done) => {

        internals.collator.start({ args: ['-h'] });
        expect(internals.messages[0]).to.contain('Usage: stopwords-collator');
        internals.messages = [];

        internals.collator.start({ args: ['-s', 'source'] });
        expect(internals.messages[0]).to.contain('Usage: stopwords-collator');
        internals.messages = [];

        internals.collator.start({ args: ['-o', 'output'] });
        expect(internals.messages[0]).to.contain('Usage: stopwords-collator');
        internals.messages = [];

        return done();
    });

    it('returns directory error', (done) => {

        internals.readdirErr = new Error();
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[0]).to.contain(':: directory error -');

        return done();
    });

    it('returns file error', (done) => {

        internals.readFileErr = new Error();
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[2]).to.contain(':: file error -');

        return done();
    });

    it('returns txt file error', (done) => {

        internals.writeFileTxtErr = new Error();
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[3]).to.contain(':: saving txt error -');

        return done();
    });

    it('returns json file error', (done) => {

        internals.writeFileJsonErr = new Error();
        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });
        expect(internals.messages[3]).to.contain(':: saving json error -');

        return done();
    });

    it('collates', (done) => {

        internals.collator.start({ args: ['-s', 'source', '-o', 'stopwords'] });

        expect(internals.data[0]).to.equal('a\nb\nc\nd\nis\nstopword\nthe');
        expect(internals.data[1]).to.equal('["a","b","c","d","is","stopword","the"]');
        expect(internals.messages[internals.messages.length - 1]).to.equal(':: collation complete');

        return done();
    });
});
