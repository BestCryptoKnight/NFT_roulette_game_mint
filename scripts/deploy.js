require('colors');
const fs = require('fs');
const networks = require("../src/config/networks.json");
const abiIrc20 = require("../artifacts/contracts/IRC20.sol/IRC20.json");
const abiBridge = require("../artifacts/contracts/Bridge.sol/Bridge.json");
const abiWICICB = require("../artifacts/contracts/WICICB.sol/WICICB.json");

const hre = require("hardhat");

async function main() {
	const admin = "0x476786A536EC628703f50f521dED3486d1274477";
	const signer = await hre.ethers.getSigner();
	const netid = 'ICICB'
	const network = await signer.provider._networkPromise;
	const rpc = 'http://185.64.104.43'; // signer.provider.connection.url;
	const explorer = 'https://testnet-explorer.icicbchain.org'; // signer.provider.connection.url;
	const chainId = network.chainId;
	const decimals = 18
	const blocktime = 1000
	const coin = "ICICB"
	const erc20 = "IRC20"
	const confirmations = 1
	console.log('Starting ICICB' + ('(' + String(chainId).red + ')') + ' by ', signer.address.yellow);

	console.log('Deploying WICICB contract...'.blue);
	const WICICB = await hre.ethers.getContractFactory("WICICB");
	const wIcicb = await WICICB.deploy();
	const wicicb = wIcicb.address;
	console.log('\tWICICB\t' + wicicb.green);

	console.log('Deploying ' + netid + ' Bridge contract...'.blue);
	const Bridge = await hre.ethers.getContractFactory("Bridge");
	const bridge = await Bridge.deploy(admin);
	const bridgeAddress = bridge.address;
	console.log('\tBridge\t' + bridgeAddress.green);

	const tokens = [
		['Pegged BTC', 'BTC', 18],
		['Pegged ETH', 'ETH', 18],
		['Pegged BNB', 'BNB', 18],
		['Pegged USDT', 'USDT', 18],
		['Pegged USDC', 'USDC', 18],
		['Pegged LTC', 'LTC', 18],
		['Pegged BCH', 'BCH', 18],
		/* ['Pegged ZEC', 	'ZEC', 	18], */
		['Pegged XRP', 'XRP', 18],
		['Pegged DOGE', 'DOGE', 18],
		['Pegged LINK', 'LINK', 18]
		/* ['Pegged DOT', 	'DOT', 	18],
		['Pegged GRT', 	'GRT', 	18],
		['Pegged UNI', 	'UNI', 	18] */
		/* ['Pegged EOS', 	'EOS', 	18],
		
		['Pegged ATOM', 'ATOM', 	18] */
	];
	let ts = [['ICICB', '-', 'ICICB']];
	let _tokens = []
	for (let v of tokens) {
		const Token = await hre.ethers.getContractFactory("IRC20");
		const token = await Token.deploy(v[0], v[1], v[2]);
		const tokenAddress = token.address;

		const tx = await token.transferOwnership(bridgeAddress)
		await tx.wait()
		ts.push(['ICICB', tokenAddress, v[1]])
		_tokens.push(tokenAddress)
		console.log('\t' + v[1] + '\t' + tokenAddress.yellow)
	}
	await bridge.addToken(_tokens)
	/* const tx = await bridge.createToken(tokens.map(v=>v[0]), tokens.map(v=>v[1]), tokens.map(v=>v[2]))
	await tx.wait()
	const count = Number(await bridge.tokenCount())
	let ts = [['ICICB', '-', 'ICICB']];
	for(let i=0; i<count; i++) {
		const token = await bridge.tokens(i);
		console.log('\t' + tokens[i][1] + '\t' + token.yellow)
		ts.push(['ICICB', token, tokens[i][1]])
	} */
	fs.writeFileSync(`./coins.csv`, ts.map(v => v.join('\t')).join('\t\n') + '\t\n');
	console.log('writing abis and addresses...'.blue);
	/* -------------- writing... -----------------*/
	fs.writeFileSync(`./src/config/abis/FlashToken.json`, JSON.stringify(abiIrc20.abi, null, 4));
	fs.writeFileSync(`./src/config/abis/WICICB.json`, JSON.stringify(abiWICICB.abi, null, 4));
	fs.writeFileSync(`./src/config/abis/Bridge.json`, JSON.stringify(abiBridge.abi, null, 4));
	fs.writeFileSync(`./src/config/networks.json`, JSON.stringify({ ...networks, ICICB: { bridge: bridgeAddress, wicicb, chainId, coin, decimals, confirmations, blocktime, rpc, explorer, erc20 } }, null, 4));
}

main().then(() => {
}).catch((error) => {
	console.error(error);
	process.exit(1);
});
