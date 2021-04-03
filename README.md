# DAO Deployer
[TOC]

#### Requirements
- nodejs
- aragon cli

`$ npm install --global @aragon/cli`


#### Get started

1. Clone repositary
2. Install modules

`$ npm i`

Default run wizard mode:

`$ npm start`

If you want run from **config.json** file:

`$npm start config <path-to-file:default(./config.json)>`

#### Config params

Param | Description | Values
-------- | ------------- | -------
`dao` | Name for the DAO Organization | `MyFirstDao` for example
`network` | The network in which the dao will be deployed | `rinkeby`, `mainnet`
`privateKey` | The private key for an account on the selected network. Import it from your metamask |
`tokenName` | The full name of the main token for the organization. It will be used for voting | `MyFirstToken` for example
`tokenSymbol` | The abbreviated name of the token. Token symbol | `MFT` for example
`holders` | Token holder addresses. Must be specified as an array | `["0x9953EEa56194E67DbD87D1E54c59488Ce0bcf624", "0x5487EEa56194E67DbD87D1E54c59488Ce0bcf624"]` for example
`stakes` | The number of tokens held by holders. Specify as an array (token has 18 decimals, multiply token **amount** * 10^18) | `["1000000000000000000000", "1000000000000000000000"]` for example 1000 MFT for each holder
`votingSettings` | Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization | `["1000000000000000000000", "1000000000000000000000"]` for example 1000 MFT for each holder
`votingSettings` | Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization | `["500000000000000000","50000000000000000","604800"]` for example
`financePeriod` | Array of [supportRequired, minAcceptanceQuorum, voteDuration] to set up the voting app of the organization | `["500000000000000000","50000000000000000","604800"]` for example
`useAgentAsVault` | Use an Agent app as a more advanced form of Vault app | `true` or `false`