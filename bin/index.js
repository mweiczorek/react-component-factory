#!/usr/bin/env node

const pd = require('pkg-dir')
const factory = require('./factory')
const cwd = process.cwd()

pd(cwd).then(rootDir => {
  if (rootDir) {
    factory(rootDir)
  } else {
    console.log(`Could not find a package.json file in the current working directory (${cwd})`)
    console.log('Navigate to the proper project directory and run me again...')
    process.exit(1)
  }
})
