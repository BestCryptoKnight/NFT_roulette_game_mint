require("colors");
const { expect } = require("chai");
const { ethers } = require("hardhat");

let bridge, owner, admin, addrs, tokens = [], swapTokens = [];
describe("UnitTest for Bridge Contract", () => {
	it("test deploy", async ()=>{
		const Bridge = await ethers.getContractFactory("Bridge");
		[owner, admin, ...addrs] = await ethers.getSigners()
		bridge = await Bridge.deploy(admin.address);
		await bridge.deployed();
		console.log('\tBridge: '.gray + bridge.address.green)
	})

	it("test for createToken", async ()=>{
		const _tokens = [
			['Pegged BTC',  'BTC', 	18],
			['Pegged ETH', 	'ETH', 	18],
			['Pegged BNB', 	'BNB', 	18],
			['Pegged USDT', 'USDT',	18],
			['Pegged USDC', 'USDC', 18],
			['Pegged LTC', 	'LTC', 	18],
			['Pegged BCH', 	'BCH', 	18],
			/* ['Pegged ZEC', 	'ZEC', 	18], */
			['Pegged XRP', 	'XRP', 	18],
			['Pegged DOGE', 'DOGE',	18],
			['Pegged LINK', 'LINK', 18]
			/* ['Pegged EOS', 	'EOS', 	18],
			['Pegged DOT', 	'DOT', 	18],
			['Pegged ATOM', 'ATOM', 18] */
		];
		const tx = await bridge.connect(admin).createToken(_tokens.map(v=>v[0]), _tokens.map(v=>v[1]), _tokens.map(v=>v[2]))
		await tx.wait()
		const count = Number(await bridge.tokenCount())
		for(let i=0; i<count; i++) {
			const token = await bridge.tokens(i)
			tokens.push(token)
			console.log(('\ttoken' + (i + 1)).gray, token.yellow)
		}
	})

	it("test for transfer", async ()=>{
		const amount = ethers.utils.parseUnits("1", 18)
		// test transfer
		const txTr = await bridge.connect(admin).transfer([
			[tokens[0], addrs[0].address, amount/* , fromChainId, fromToken, extra */], 
			[tokens[1], addrs[1].address, amount/* , fromChainId, fromToken, extra */], 
			[tokens[2], addrs[2].address, amount/* , fromChainId, fromToken, extra */]
		]);
		await txTr.wait()
		const token1 = new ethers.Contract(tokens[0], ['function balanceOf(address) public view returns (uint256)'], owner)
		const token2 = new ethers.Contract(tokens[1], ['function balanceOf(address) public view returns (uint256)'], owner)
		const token3 = new ethers.Contract(tokens[2], ['function balanceOf(address) public view returns (uint256)'], owner)
		console.log('\taddress1:'.gray + addrs[0].address.blue + ': ', ethers.utils.formatUnits(await token1.balanceOf(addrs[0].address), 18).red + ' ethers'.red)
		console.log('\taddress2:'.gray + addrs[1].address.blue + ': ', ethers.utils.formatUnits(await token2.balanceOf(addrs[1].address), 18).red + ' ethers'.red)
		console.log('\taddress3:'.gray + addrs[2].address.blue + ': ', ethers.utils.formatUnits(await token3.balanceOf(addrs[2].address), 18).red + ' ethers'.red)
	})

	it("test for deposit", async ()=>{
		const amount = ethers.utils.parseUnits("0.5", 18)
		// test transfer
		const txTr = await bridge.connect(addrs[0]).deposit(tokens[0], amount, 1);
		await txTr.wait()

		const token1 = new ethers.Contract(tokens[0], ['function balanceOf(address) public view returns (uint256)'], owner)
		const balance = ethers.utils.formatUnits(await token1.balanceOf(addrs[0].address), 18)
		console.log('\taddress1:'.gray + addrs[0].address.blue + ': ', balance.red + ' ethers'.red)
		expect(0.5==Number(balance), "correct")
	})

	it("deploy IRC20 tokens", async ()=>{
		swapTokens
		const DeployTokens = await ethers.getContractFactory("DeployTokens");
		const arrs = ['BTC', 'LTC']
		const deployTokens = await DeployTokens.deploy(arrs, owner.address);
		await deployTokens.deployed();
		swapTokens = await deployTokens.getTokens()
		for(let i=0; i<swapTokens.length; i++) {
			console.log(('\t' + arrs[i] + ': ').gray, swapTokens[i].yellow)
		}
	})

	it("test for deposit of non pegged token", async ()=>{
		const amount = ethers.utils.parseUnits("100", 18)
		// test transfer
		const token = new ethers.Contract(swapTokens[0], [
			'function approve(address spender, uint256 amount) public  returns (bool)',
			'function balanceOf(address) public view returns (uint256)'
		], owner)
		const txAp = await token.approve(bridge.address, amount);
		await txAp.wait()
		const txDp = await bridge.deposit(swapTokens[0], amount, 1);
		await txDp.wait()
		const balance = ethers.utils.formatUnits(await token.balanceOf(bridge.address), 18)
		console.log('\tdeposited:'.gray, balance.red + ' BTC'.red)
		expect(0.5==Number(balance), "correct")
	})
})
