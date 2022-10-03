
import { ethers } from "ethers";
import { supportChainId, supportChainId_testNet } from '../config/global.const';
import Contracts from "./abi/nft.json";


const RPCS = {
    1: "https://eth-mainnet.nodereal.io/v1/1659dfb40aa24bbb8153a677b98064d7",
    4: "https://rinkeby.infura.io/v3/580d6de4d2694cbdbee111d2f553dbcc",
    56: "https://bsc-dataseed1.ninicoin.io",
}
// 4 Rinkeby testnet : https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161	

const providers = {
    56: new ethers.providers.JsonRpcProvider(RPCS[56]),
    // 417: new ethers.providers.JsonRpcProvider(RPCS[417]),
    // 1337: new ethers.providers.JsonRpcProvider(RPCS[1337]),
    // 31337: new ethers.providers.JsonRpcProvider(RPCS[31337])
}

const casinoContract = new ethers.Contract(Contracts.casino.address, Contracts.casino.abi);
const rouletteContract = new ethers.Contract(Contracts.roulette.address, Contracts.roulette.abi);
const usdcContract = new ethers.Contract(Contracts.usdc.address, Contracts.usdc.abi);
// let myContract = new ethers.Contract(tokenAddress, Abi);


export {
    supportChainId,
    casinoContract,
    rouletteContract,
    usdcContract,
    providers
}