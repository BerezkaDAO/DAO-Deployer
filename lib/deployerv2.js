const { exec } = require("child_process");
var libs = process.cwd() + '/lib/';
const chalk = require('chalk');
var log = require(libs + 'log')(module);
const ora = require('ora');
var deployerv2 = {
    deploy: async function (config) {
        const as = config.appSettings
        const dao = {}
        config.dao = config.dao + this.randomInt(1000, 100000)
        dao.config = config
        if (dao.config.wsrpc != undefined) {
            dao.config.env = ` --ws-rpc ${dao.config.wsrpc}`
        } else {
            dao.config.env = ''
        }
        if(dao.config.useFrame){
            dao.config.env += ' --use-frame'
        }
        if(dao.config.gasPrice != undefined){
            dao.config.env += ' --gas-price '+ dao.config.gasPrice
        }
        const spinner = ora({ text: `Deploying New DAO "${config.dao}"...`, color: 'green' }).start();
        //TEMP

        exec(`dao new --aragon-id ${config.dao} --environment aragon:${dao.config.network}${dao.config.env}`, async (error, stdout, stderr) => {
            if (error) {
                console.error(`exec error: ${error}`);
                spinner.stopAndPersist({ symbol: 'x', text: 'Deploy Error' })
                return;
            }
            let daoAddress = ""
            let createdDao = stdout.indexOf(' at ')
            spinner.stopAndPersist({ symbol: '✔', text: 'Deploy Complete' })

            if (createdDao != -1) {
                daoAddress = stdout.substr(createdDao + 4, 42)
                console.log(chalk.cyan(`✔ DAO ${config.dao} successfully created at address:`))
                console.log(chalk.green(daoAddress))

                console.log(chalk.blue(this.getDaoUrl(config)))

                console.log(chalk.blue(this.getRawDaoUrl(config, daoAddress)))
                dao.address = daoAddress
                dao.tokenManager = []
                dao.token = []
                //TOKENS
                console.log("Deploy tokens:")
                let tokenForDeploy = dao.config.appSettings.tokens.slice()
                this.recursiveDeployTokens(dao, tokenForDeploy)
                    .then(_ => {
                        console.log('All tokens deployed')
                        //INSTALL APPS
                        this.installApps(dao)
                    })
            } else {
                console.log(`stdout: ${stdout}`);
            }
        });
    },
    checkPrivateKey: function (privateKey) {
        if (true) { }
    },
    recursiveDeployTokens: function (dao, tokens) {
        const nextToken = tokens.shift();

        if (nextToken) {
            return this.deployToken(dao, nextToken).then(_ => this.recursiveDeployTokens(dao, tokens))
        } else {
            return Promise.resolve();
        }
    },
    deployToken(dao, token) {
        return new Promise((resolve) => {
            //TOKEN MANAGER
            let spinner = ora({ text: 'Deploy token manager...', color: 'green' }).start();
            exec(`dao install ${dao.address} token-manager --app-init none --environment aragon:${dao.config.network}${dao.config.env}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    spinner.stopAndPersist({ symbol: 'x', text: 'Error' })
                    return;
                }
                spinner.stopAndPersist({ symbol: '✔', text: 'Token manager installed' })
                let tokenManager = ""
                let createdAddress = stdout.indexOf(' at: ')
                if (createdAddress != -1) {
                    tokenManager = stdout.substr(createdAddress + 5, 42)
                    console.log(chalk.cyan(`✔ Token manager successfully installed at address:`))
                    console.log(chalk.green(tokenManager))
                    dao.tokenManager.push(tokenManager)
                    this.acl(dao, { app: tokenManager, role: "MINT_ROLE", p1: dao.config.appSettings.tokens[0].holders[0], p2: dao.config.appSettings.tokens[0].holders[0] }).then(() => {
                        spinner = ora({ text: `Deploy token ${token.symbol}...`, color: 'green' }).start();
                        exec(`dao token new "${token.name}" "${token.symbol}" 0 true --environment aragon:${dao.config.network}${dao.config.env}`, (error, stdout, stderr) => {
                            if (error) {
                                console.error(`exec error: ${error}`);
                                spinner.stopAndPersist({ symbol: 'x', text: 'Error' })
                                return;
                            }
                            //console.log(stdout)
                            let tokenAddr = ""
                            let createdAddress = stdout.indexOf(' at ')
                            spinner.stopAndPersist({ symbol: '✔', text: 'Token Created' })
            
                            if (createdAddress != -1) {
                                tokenAddr = stdout.substr(createdAddress + 4, 42)
                                console.log(chalk.cyan(`✔ Token ${token.symbol} successfully created at address:`))
                                console.log(chalk.green(tokenAddr))
                                dao.token.push(tokenAddr)
                                //change-controller
                                spinner = ora({ text: 'Token Change-controller...', color: 'green' }).start();
                                exec(`dao token change-controller ${tokenAddr} ${tokenManager} --environment aragon:${dao.config.network}${dao.config.env}`, (error, stdout, stderr) => {
                                    if (error) {
                                        console.error(`exec error: ${error}`);
                                        spinner.stopAndPersist({ symbol: 'x', text: 'Error' })
                                        return;
                                    }
                                    //console.log(stdout)                                    
                                    spinner.stopAndPersist({ symbol: '✔', text: 'Done' })
            
                                    //TokenManager initialize
                                    spinner = ora({ text: 'TokenManager initialize token...', color: 'green' }).start();
                                    exec(`dao exec ${dao.address} ${tokenManager} initialize ${tokenAddr} false 0 --environment aragon:${dao.config.network}${dao.config.env}`, (error, stdout, stderr) => {
                                        if (error) {
                                            console.error(`exec error: ${error}`);
                                            spinner.stopAndPersist({ symbol: 'x', text: 'Error' })
            
                                        }
                                        //console.log(stdout)                                    
                                        spinner.stopAndPersist({ symbol: '✔', text: 'Done' })
                                        resolve()
                                    });
            
                                });
            
            
                            } else {
                                console.log(`stdout: ${stdout}`);
                            }
                        });
                       

                    })
                } else {
                    console.log(`stdout: ${stdout}`);
                }

            });
            
        });
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
    getRawDaoUrl: function (config, daoAddress) {
        switch (config.network) {
            case 'rinkeby':
                return `https://rinkeby.client.aragon.org/#/${daoAddress}`
                break;
            case 'mainnet':
                return `https://client.aragon.org/#/${daoAddress}`
        }
    },
    acl: function (dao, opt) {
        //mode, app, role, p1, p2
        let mode = opt.mode || "create"
        // let spinner = ora({ text: `Set Default Permission for app ${opt.app}...`, color: 'green' }).start();
        return new Promise((result) => {
            console.log(`Set permission ${opt.role} for ${opt.app}`)
            exec(`dao acl ${mode} ${dao.address} ${opt.app} ${opt.role} ${opt.p1} ${opt.p2} --environment aragon:${dao.config.network}${dao.config.env}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    // spinner.stopAndPersist({ symbol: 'x', text: 'Error' })
                }
                // spinner.stopAndPersist({ symbol: '✔', text: 'Set permission Done' })
                console.log(`Set permission Done`)
                result();
            });
        });
    },
    installApps: function (dao) {
        const as = dao.config.appSettings
        let baseApps = []
        if ('voting' in as) {
            this.installApp(dao, { spinner: true, app: "voting", args: [dao.token[0], as.voting.supportRequiredPercentage, as.voting.minAcceptQuorum, as.voting.voteTime] }).then(result => {
                console.log(`x ${result} x`)
                dao.voting = result
                let p = this.acl(dao, { app: dao.voting, role: "CREATE_VOTES_ROLE", p1: dao.tokenManager[0], p2: dao.voting })
                let secondApps = []
                //let spinner = ora({ text: 'Install some apps...', color: 'green' }).start();
                console.log(chalk.cyan(`Install some apps..`))
                if ('finance' in as) {
                    this.installApp(dao, { app: "vault" }).then(result => {
                        dao.vault = result
                        this.installApp(dao, { app: "finance", args: [dao.vault, as.finance.budgetPeriod] }).then(result => {
                            dao.finance = result

                            this.acl(dao, { app: dao.vault, role: "TRANSFER_ROLE", p1: dao.finance, p2: dao.voting }).then(() => {
                                this.acl(dao, { app: dao.finance, role: "CREATE_PAYMENTS_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                    this.acl(dao, { app: dao.finance, role: "EXECUTE_PAYMENTS_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                        this.acl(dao, { app: dao.finance, role: "MANAGE_PAYMENTS_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                            if ('addressBook' in as) {
                                                let ab = this.installApp(dao, { app: "address-book.aragonpm.eth" }).then(result => {
                                                    dao.addressBook = result
                                                    this.acl(dao, { app: dao.addressBook, role: "ADD_ENTRY_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                        this.acl(dao, { app: dao.addressBook, role: "REMOVE_ENTRY_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                            this.acl(dao, { app: dao.addressBook, role: "UPDATE_ENTRY_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                // REWARD
                                                                this.installApp(dao, { app: "rewards.aragonpm.eth", args: [dao.vault] }).then(result => {
                                                                    dao.rewards = result
                                                                    this.acl(dao, { app: dao.rewards, role: "ADD_REWARD_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                        // DOT-VOTING
                                                                        this.installApp(dao, { app: "dot-voting.aragonpm.eth", args: [dao.token[0], as.dotVoting.minQuorum, as.dotVoting.candidateSupportPct, as.dotVoting.voteDuration] }).then(result => {
                                                                            dao.dotVoting = result
                                                                            this.acl(dao, { app: dao.dotVoting, role: "ROLE_CREATE_VOTES", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                this.acl(dao, { app: dao.dotVoting, role: "ROLE_ADD_CANDIDATES", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                    // Allocations 
                                                                                    this.installApp(dao, { app: "allocations.aragonpm.eth", args: [dao.token[0], as.allocations.period] }).then(result => {
                                                                                        dao.allocations = result
                                                                                        this.acl(dao, { app: dao.allocations, role: "CREATE_ACCOUNT_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                            this.acl(dao, { app: dao.allocations, role: "CHANGE_BUDGETS_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                this.acl(dao, { app: dao.allocations, role: "CREATE_ALLOCATION_ROLE", p1: dao.dotVoting, p2: dao.voting }).then(() => {
                                                                                                    this.acl(dao, { app: dao.allocations, role: "EXECUTE_ALLOCATION_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                        this.acl(dao, { app: dao.allocations, role: "EXECUTE_PAYOUT_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                            //DELAY
                                                                                                            this.installApp(dao, { app: "delay.aragonpm.eth", args: [as.delay.period] }).then(result => {
                                                                                                                dao.delay = result
                                                                                                                this.acl(dao, { app: dao.delay, role: "DELAY_EXECUTION_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                    this.acl(dao, { app: dao.delay, role: "SET_DELAY_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                        this.acl(dao, { app: dao.delay, role: "PAUSE_EXECUTION_ROLE", p1: dao.dotVoting, p2: dao.voting }).then(() => {
                                                                                                                            this.acl(dao, { app: dao.delay, role: "RESUME_EXECUTION_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                this.acl(dao, { app: dao.delay, role: "CANCEL_EXECUTION_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                    //PROJECTS
                                                                                                                                    //TODO FOR RINKEBY ONLY
                                                                                                                                    dao.registry = "0x38f1886081759f7d352c28984908d04e8d2205a6"
                                                                                                                                    this.installApp(dao, { app: "projects.aragonpm.eth", args: [dao.registry, dao.vault] }).then(result => {
                                                                                                                                        dao.projects = result
                                                                                                                                        this.acl(dao, { app: dao.projects, role: "FUND_ISSUES_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                            this.acl(dao, { app: dao.projects, role: "REVIEW_APPLICATION_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                                this.acl(dao, { app: dao.projects, role: "WORK_REVIEW_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                                    this.acl(dao, { app: dao.projects, role: "ADD_REPO_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                                        this.acl(dao, { app: dao.projects, role: "REMOVE_REPO_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                                            this.acl(dao, { app: dao.projects, role: "CHANGE_SETTINGS_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                this.acl(dao, { app: dao.projects, role: "FUND_OPEN_ISSUES_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                                                    this.acl(dao, { app: dao.projects, role: "REMOVE_ISSUES_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                                                        this.acl(dao, { app: dao.projects, role: "UPDATE_BOUNTIES_ROLE", p1: dao.token[0], p2: dao.voting }).then(() => {
                                                                                                                                                                            this.acl(dao, { app: dao.projects, role: "CURATE_ISSUES_ROLE", p1: dao.dotVoting, p2: dao.voting }).then(() => {
                                                                                                                                                                                //Token Request
                                                                                                                                                                                this.installApp(dao, { app: "token-request.aragonpm.eth", args: [dao.vault, dao.tokenManager[0], '"[]"' ]}).then(result => {
                                                                                                                                                                                    dao.tokenRequest = result
                                                                                                                                                                                    this.acl(dao, { app: dao.tokenRequest, role: "SET_TOKEN_MANAGER_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                        this.acl(dao, { app: dao.tokenRequest, role: "SET_VAULT_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                            this.acl(dao, { app: dao.tokenRequest, role: "FINALISE_TOKEN_REQUEST_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                                this.acl(dao, { app: dao.tokenRequest, role: "MODIFY_TOKENS_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                                    //REDEMPTION
                                                                                                                                                                                                    this.installApp(dao, { app: "redemptions.aragonpm.eth", args: [dao.vault, dao.tokenManager[1], `"['${dao.token[1]}']"`]}).then(result => {
                                                                                                                                                                                                        dao.redemptions = result
                                                                                                                                                                                                        this.acl(dao, { app: dao.redemptions, role: "REDEEM_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                                            this.acl(dao, { app: dao.redemptions, role: "ADD_TOKEN_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                                                this.acl(dao, { app: dao.redemptions, role: "REMOVE_TOKEN_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                                                    //AGENT
                                                                                                                                                                                                                    this.installApp(dao, { app: "agent", args: []}).then(result => {
                                                                                                                                                                                                                        dao.agent = result
                                                                                                                                                                                                                        this.acl(dao, { app: dao.agent, role: "EXECUTE_ROLE", p1: dao.voting, p2: dao.voting }).then(() => {
                                                                                                                                                                                                                            console.log("ALL DONE")
                                                                                                                                                                                                                        })
                                                                                                                                                                                                                    })
                                                                                                                                                                                                                })
                                                                                                                                                                                                            })
                                                                                                                                                                                                        })
                                                                                                                                                                                                    })
                                                                                                                                                                                                })
                                                                                                                                                                                            })
                                                                                                                                                                                        })
                                                                                                                                                                                    })
                                                                                                                                                                                })
                                                                                                                                                                            })
                                                                                                                                                                        })
                                                                                                                                                                    })
                                                                                                                                                                })
                                                                                                                                                            })
                                                                                                                                                        })
                                                                                                                                                    })
                                                                                                                                                })

                                                                                                                                            })
                                                                                                                                        })
                                                                                                                                    })
                                                                                                                                })
                                                                                                                            })
                                                                                                                        })

                                                                                                                    })
                                                                                                                })
                                                                                                            })
                                                                                                        })
                                                                                                    })
                                                                                                })

                                                                                            })
                                                                                        })
                                                                                    })
                                                                                })
                                                                            })
                                                                        })
                                                                    })
                                                                })
                                                            })
                                                        })
                                                    })
                                                })
                                            }

                                            Promise.all(secondApps).then(values => {
                                                //console.log(values);

                                            })
                                        })
                                    })
                                })
                            })

                        })
                    })
                }
            })
        }

    },
    installApp: function (dao, opt) {
        let args = opt.args || ""
        if (args != '') {
            args = "--app-init-args " + args.join(' ')
        }
        return new Promise((result) => {
            let spinner
            if (opt.spinner) {
                spinner = ora({ text: `Install ${opt.app}...`, color: 'green' }).start();
            }
            exec(`dao install ${dao.address} ${opt.app} ${args} --environment aragon:${dao.config.network}${dao.config.env}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`exec error: ${error}`);
                    if (opt.spinner)
                        spinner.stopAndPersist({ symbol: 'x', text: 'Error' })
                }
                let appAddress = ""
                let createdAddress = stdout.indexOf(' at: ')

                if (createdAddress != -1) {
                    appAddress = stdout.substr(createdAddress + 5, 42)

                }
                //console.log(stdout)
                if (opt.spinner) {
                    spinner.stopAndPersist({ symbol: '✔', text: `${opt.app} ready at ${appAddress}` })
                } else {
                    console.log(chalk.cyan(`${opt.app} ready at:`))
                    console.log(chalk.green(appAddress))
                }
                result(appAddress)
            });
        });
    },
    randomInt: function (min, max) {
        return min + Math.floor((max - min) * Math.random());
    }
}
module.exports = deployerv2;