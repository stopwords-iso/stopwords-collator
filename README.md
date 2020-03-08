Stopwords Collator
=======

[![Build Status](https://travis-ci.org/stopwords-iso/stopwords-collator.svg?branch=master)](https://travis-ci.org/stopwords-iso/stopwords-collator)
[![Coverage Status](https://coveralls.io/repos/github/stopwords-iso/stopwords-collator/badge.svg?branch=master)](https://coveralls.io/github/stopwords-iso/stopwords-collator?branch=master)
[![Code Climate](https://codeclimate.com/github/stopwords-iso/stopwords-collator/badges/gpa.svg)](https://codeclimate.com/github/stopwords-iso/stopwords-collator)
[![Dependency Status](https://david-dm.org/stopwords-iso/stopwords-collator.svg)](https://david-dm.org/stopwords-iso/stopwords-collator)
[![Known Vulnerabilities](https://snyk.io/test/github/stopwords-iso/stopwords-collator/badge.svg)](https://snyk.io/test/github/stopwords-iso/stopwords-collator)

Organize raw stopwords into a JSON and a text file.
It does the following:
- Convert to lower case
- Strip CRs
- Strip BOMs
- Strip duplicates
- Strip whitespaces
- Split tab separated words
- Sort final result
- Ignore lines starting with `#`

### Command Line
The following command line options are supported:
- `-s <path>` - Directory of the stopwords text files (.txt)
- `-o <path>` - filename and path to output file.

```sh
$ stopwords-collator -s raw -o lib/stopwords
```

### Contributing
* Include 100% test coverage and no eslint issue.
* Submit an issue first for significant changes.
