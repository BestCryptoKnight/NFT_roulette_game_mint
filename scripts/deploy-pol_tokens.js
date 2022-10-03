require('colors');
const fs = require('fs');
const hre = require("hardhat");

async function main() {
    const signer = await hre.ethers.getSigner();
    const DeployTokens = await hre.ethers.getContractFactory("DeployTokens");
    const tokens = [
        'FLASH',
    ];
    const deployTokens = await DeployTokens.deploy(tokens, signer.address);
    const addrs = await deployTokens.getTokens();
    console.log('polygon tokens');
    let ts = [['polygon', '-', 'FLASH']];
    for (let i = 0; i < addrs.length; i++) {
        console.log('\t' + tokens[i].blue + '\t' + addrs[i].green);
        ts.push(['polygon', addrs[i], tokens[i]])
    }
    fs.appendFileSync(`./coins.csv`, ts.map(v => v.join('\t')).join('\t\n') + '\t\n');
}

main().then(() => {
}).catch((error) => {
    console.error(error);
    process.exit(1);
});
