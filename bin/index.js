#!/usr/bin/env node

const pd = require('pkg-dir')
const factory = require('./factory')
pd(process.cwd()).then(d => factory(d))
