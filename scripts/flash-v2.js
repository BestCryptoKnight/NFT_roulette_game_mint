require('colors');
const fs = require('fs');
const hre = require("hardhat");

async function main() {
	const signer = await hre.ethers.getSigner();
	const FLASH = await hre.ethers.getContractFactory("FLASH");

	console.log(' deploy');
	const deployToken = await FLASH.deploy();

	console.log(deployToken.address.green);
	const network = await signer.provider._networkPromise;

	const info = network.chainId + " - " + deployToken.address;
	fs.writeFileSync(`./coins.csv`, info + '\t\n');
}

main().then(() => {
}).catch((error) => {
	console.error(error);
	process.exit(1);
});

