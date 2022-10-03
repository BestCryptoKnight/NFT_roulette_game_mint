require('colors');
const fs = require('fs');
const networks = require("../src/config/networks.json");
/* const abiBridge = require("../artifacts/contracts/Bridge.sol/Bridge.json"); */

const hre = require("hardhat");

async function main() {
	const netId = "POL"
	const decimals = 18
	const admin = "0x476786A536EC628703f50f521dED3486d1274477";//same address in my wallet

	const signer = await hre.ethers.getSigner();
	const network = await signer.provider._networkPromise;
	const rpc = 'https://rpc-mumbai.maticvigil.com/'; // signer.provider.connection.url;
	const explorer = 'https://mumbai.polygonscan.com/'; // signer.provider.connection.url;
	const chainId = network.chainId;
	const blocktime = 3000
	const erc20 = 'ERC20';
	const confirmations = 14

	const coin = 'MATIC'
	console.log('Starting ' + netId + ('(' + String(chainId).red + ')') + ' by ', signer.address.yellow);

	console.log('Deploying ' + netId + ' Bridge contract...'.blue);
	const Bridge = await hre.ethers.getContractFactory("Bridge");
	const bridge = await Bridge.deploy(admin);
	console.log('\tBridge\t' + bridge.address.green);

	console.log('writing network...'.blue);
	/* -------------- writing... -----------------*/
	fs.writeFileSync(`./src/config/networks.json`, JSON.stringify({ ...networks, [netId]: { bridge: bridge.address, chainId, coin, decimals, confirmations, blocktime, rpc, explorer, erc20 } }, null, 4));
}

main().then(() => {
}).catch((error) => {
	console.error(error);
	process.exit(1);
});
