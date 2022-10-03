require('colors');
const fs = require('fs');
const networks = require("../src/config/networks.json");
/* const abiBridge = require("../artifacts/contracts/Bridge.sol/Bridge.json"); */

const hre = require("hardhat");

async function main() {
	const netId = "BSC"
	const decimals = 18
	const admin = "0x476786A536EC628703f50f521dED3486d1274477";

	const signer = await hre.ethers.getSigner();
	const network = await signer.provider._networkPromise;
	const rpc = 'https://data-seed-prebsc-1-s1.binance.org:8545'; // signer.provider.connection.url;
	const explorer = 'https://testnet.bscscan.com/'; // signer.provider.connection.url;
	const chainId = network.chainId;
	const blocktime = 3000;
	const erc20 = 'BEP20';
	const confirmations = 12
	const coin = "BNB"
	console.log('Starting ' + netId + ('(' + String(chainId).red + ')') + ' by ', signer.address.yellow);

	console.log('Deploying ' + netId + ' Bridge contract...'.blue);
	const Bridge = await hre.ethers.getContractFactory("Bridge");
	const bridge = await Bridge.deploy(admin);
	console.log('\tBridge' + '\t' + bridge.address.green);

	console.log('writing network...'.blue);
	/* -------------- writing... -----------------*/
	fs.writeFileSync(`./src/config/networks.json`, JSON.stringify({ ...networks, [netId]: { bridge: bridge.address, chainId, coin, decimals, confirmations, blocktime, rpc, explorer, erc20 } }, null, 4));
}

main().then(() => {
}).catch((error) => {
	console.error(error);
	process.exit(1);
});
