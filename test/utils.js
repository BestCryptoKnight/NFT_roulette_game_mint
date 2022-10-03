
const { ethers } = require("hardhat");


function delay(delayInms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}

function toBigNum(value,d) {
    return ethers.utils.parseUnits(value, d);
}

function fromBigNum(value,d) {
    return ethers.utils.formatUnits(value, d);
}

module.exports = {delay, toBigNum, fromBigNum};