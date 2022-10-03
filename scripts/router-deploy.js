require('colors');
const fs = require('fs');
const hre = require("hardhat");

async function main() {
	const signer = await hre.ethers.getSigner();
	const PancakeRouter = await hre.ethers.getContractFactory("PancakeRouter");
	const PancakeFactory = await hre.ethers.getContractFactory("PancakeFactory");

	console.log(' deploy -> PancakeRouter and PancakeFactory');
	const pancake_factory = await PancakeFactory.deploy("0x476786A536EC628703f50f521dED3486d1274477");//wallet address
	await pancake_factory.deployed()

	const pancake_router = await PancakeRouter.deploy(pancake_factory.address, "0x796135e94527c38433e9c42f4cd91ca931e5e6a6");
	await pancake_router.deployed();

	//pancake_factory address AND   -> template //0x796135e94527c38433e9c42f4cd91ca931e5e6a6  -> weth on cronos

	console.log("pancake_router:  " + pancake_router.address.green);
	console.log("pancake_factory:  " + pancake_factory.address.green);
	const network = await signer.provider._networkPromise;

	const info = "chainId: " + network.chainId + " -> router: " + pancake_router.address + ", factory: " + pancake_factory.address;
	fs.writeFileSync(`./pancake.csv`, info + '\t\n');
}

main().then(() => {
}).catch((error) => {
	console.error(error);
	process.exit(1);
});

