/* const { ethers } = require('hardhat'); */

require('colors');

async function main() {
	const signer = await ethers.getSigner();
	const network = await signer.provider._networkPromise;
	const chainId = network.chainId;
	console.log('Starting Ganache ' + ('(' + String(chainId).red + ')') + ' by ', signer.address.yellow);

	const tokens = [
		['Pegged USDT', 'USDT', 6],
		['Pegged USDC', 'USDC', 6],
		['Pegged BTC', 'BTC', 8],
		['WETH', 'WETH', 18],
	];
	const to = '0x79342eE3f703Cb2bcDA33942cFB64353FE40F16C';
	var tx = await signer.sendTransaction({
		to,
		value: ethers.utils.parseUnits("100", 18)
	});
	await tx.wait()
	// await signer.sendTansaction({to:'0xC5df89579D7A2f85b8a4b1a6395083da394Bba92', value:ethers.utils.parseUnits("10", 18)})
	for (let v of tokens) {
		const Token = await ethers.getContractFactory("IRC20");
		const token = await Token.deploy(v[0], v[1], v[2]);
		const mintValue = '0x' + BigInt(1e22).toString(16)
		await token.mint(mintValue)
		const tokenAddress = token.address;
		await token.transfer(to, mintValue)
		console.log(tokenAddress.yellow)
	}
}

main().then(() => {
}).catch((error) => {
	console.error(error);
	process.exit(1);
});
