const { exec } = require("child_process");
var libs = process.cwd() + '/lib/';
const chalk = require('chalk');
var log = require(libs + 'log')(module);
const ora = require('ora');
var deployer = {
    deploy: function (config) {
        fnArgs = `${config.tokenName} ${config.tokenSymbol} ${config.dao} ['"${config.holders.join('","')}"'] ['"${config.stakes.join('","')}"'] ['"${config.votingSettings.join('","')}"'] ${config.financePeriod} ${config.useAgentAsVault}`


        const spinner = ora({text:'Deploying New DAO...', color:'green'}).start();
        let assigningAragonId = ''
        if(config.assigningAragonId){
            assigningAragonId = `--aragon-id ${config.dao} `
        }
        exec(`dao new ${assigningAragonId}--environment aragon:${config.network} --template company-template --fn newTokenAndInstance --fn-args ${fnArgs}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                spinner.stopAndPersist({symbol:'x',text:'Deploy Error'})
                return;
            }
            let daoAddress = ""
            let createdDao = stdout.indexOf('Created DAO:')
            spinner.stopAndPersist({symbol:'✔',text:'Deploy Complete'})
            if (createdDao != -1) {
                daoAddress = stdout.substr(createdDao + 13, 42)
                console.log(chalk.cyan(`✔ DAO successfully created at address:`))
                console.log(chalk.green(daoAddress))
                
                if(config.assigningAragonId)
                    console.log(chalk.blue(this.getDaoUrl(config)))

                console.log(chalk.blue(this.getRawDaoUrl(config, daoAddress)))
            } else {
                console.log(`stdout: ${stdout}`);
            }
            //console.error(`stderr: ${chalk.yellow(stderr)}`);
        });
    },
    checkPrivateKey: function (privateKey) {
        if (true) { }
    },
    getDaoUrl: function (config) {        
            switch (config.network) {
                case 'rinkeby':
                    return `https://rinkeby.client.aragon.org/#/${config.dao}.aragonid.eth`
                    break;
                case 'mainnet':
                    return `https://client.aragon.org/#/${config.dao}.aragonid.eth`
            }
    },
    getRawDaoUrl:function(config, daoAddress){
        switch (config.network) {
            case 'rinkeby':
                return `https://rinkeby.client.aragon.org/#/${daoAddress}`
                break;
            case 'mainnet':
                return `https://client.aragon.org/#/${daoAddress}`
        }
    }

}
module.exports = deployer;