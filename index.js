var libs = process.cwd() + '/lib/';
var log = require(libs + 'log')(module);
var lib = require(libs + 'lib');
const fs = require("fs");
const username = require('username').sync();
const chalk = require('chalk');
const deployer = require(libs + 'deployer')
const deployerv2 = require(libs + 'deployerv2')
var argv = require("minimist")(process.argv.slice(2));

const mode = argv._[0] || 'wizard'
console.log(`DAO Deployer start by ${chalk.blue(username)} with mode ${chalk.blue(mode)}`)

switch(mode){
    case 'config':
        config = require('./config.json')
        deployer.deploy(config)
        break;
    case 'configv2':
        config = require('./configv2.json')
        deployerv2.deploy(config)
        break;
    default:
        //require(libs + 'wizard')        
        break;
}
