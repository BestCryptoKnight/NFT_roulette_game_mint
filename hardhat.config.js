require('dotenv').config();
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require('hardhat-deploy');
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html


// task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
// 	const accounts = await hre.ethers.getSigners();

// 	for (const account of accounts) {
// 		console.log(account.address);
// 	}
// });

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	networks: {
		localhost: {
			url: "http://127.0.0.1:8545"
		},
		ganache: {
			url: "http://192.168.115.173:7545",
			accounts: [process.env.PRIVATEKEY]
		},
		icicblocaltest: {
			url: "http://192.168.115.173:5050",
			accounts: [process.env.PRIVATEKEY]
		},
		icicb: {
			url: "http://185.64.104.43",
			accounts: [process.env.PRIVATEKEY]
		},
		icicbtestnet: {
			url: "http://13.58.153.103",
			accounts: [process.env.PRIVATEKEY]
		},
		fantom: {
			url: "https://rpc.ftm.tools/",
			accounts: [process.env.PRIVATEKEY]
		},
		fantomtestnet: {
			url: "https://rpc.testnet.fantom.network",
			accounts: [process.env.PRIVATEKEY]
		},
		eth: {
			url: "https://eth-mainnet.nodereal.io/v1/1659dfb40aa24bbb8153a677b98064d7",
			accounts: [process.env.PRIVATEKEY]
		},
		ethtest: {
			url: "https://rinkeby.infura.io/v3/580d6de4d2694cbdbee111d2f553dbcc",
			accounts: [process.env.PRIVATEKEY]
		},
		bsc: {
			url: "https://bsc-dataseed1.ninicoin.io/",
			accounts: [process.env.PRIVATEKEY]
		},
		bsctestnet: {
			url: "https://data-seed-prebsc-1-s1.binance.org:8545/",
			accounts: [process.env.PRIVATEKEY]
		},
		matic: {
			url: "https://rpc-mainnet.matic.quiknode.pro",
			accounts: [process.env.PRIVATEKEY]
		},
		matictest: {
			url: "https://rpc-mumbai.maticvigil.com/v1/b80060e67d2549335777279d75f6788fe240bf9b",
			accounts: [process.env.PRIVATEKEY]
		},
		cronos: {
			url: "https://evm.cronos.org",
			accounts: [process.env.PRIVATEKEY]
		},
		cronostest: {
			url: "https://evm-t3.cronos.org/",
			accounts: [process.env.PRIVATEKEY]
		},
	},
	etherscan: {
		// Your API key for Etherscan
		// Obtain one at https://etherscan.io/
		apiKey: "4YR6VIGHEJJSZSJB78GZEDVVVYUU8YHF7C"
	},
	solidity: {
		compilers: [
			{
				version: "0.8.14",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				}
			},
			{
				version: "0.6.6",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				}
			},
			{
				version: "0.5.16",
				settings: {
					optimizer: {
						enabled: true,
						runs: 200,
					},
				}
			},
		]
	},
	mocha: {
		timeout: 20000
	}
};

// url: "https://evm-t3.cronos.org/",
// https://cronos-testnet-3.crypto.org:8545/

