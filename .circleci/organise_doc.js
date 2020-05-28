'use strict'

const fs = require('fs')
const args = require('minimist')(process.argv.slice(2))

// get SDK name and version from package files
// they are used by JSDoc to generate the output directories
const packageJSON = require('../package.json')
const packageVersion = packageJSON.version
const packageName = packageJSON.name

// get the output directory
const jsdocJSON = require('../jsdoc.json')
const jsdocOpts = jsdocJSON.opts
const jsDocOutputDir = jsdocOpts.destination

// root dir is the absolute path to use, provided by CI
const rootDir = args.rootdir
if (rootDir === '' || rootDir == null){
  console.error('rootDir argument must be defined');
  process.exit(1);
}
// the tag being built and empty or null if none
const tag = args.tag

// if no tag, doc will go in latest directory by default
const targetDir = (tag === '' || tag == null) ? 'latest' : tag

// source directories where JSdoc put the doc
const sourceDirBase = `${rootDir}/${jsDocOutputDir}`
const sourceDir = `${sourceDirBase}/${packageName}/${packageVersion}`

// check if source exists and move files to latest or tag matching directory
fs.rename(sourceDir, `${rootDir}/docs/${targetDir}`, (err) => {
  if (err) throw err
  fs.rmdirSync(sourceDirBase, {recursive:true})
  console.log('Doc organisation success')
})
