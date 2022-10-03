/**
 *Submitted for verification at Etherscan.io on 2022-04-18
 */

// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/token/ERC721/IERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '../interfaces/IUniswapV2Pair.sol';
import '../interfaces/IUniswapV2Factory.sol';
import '../interfaces/IUniswapV2Router.sol';
import '../interfaces/IPLSP.sol';

contract RoulettePot is Ownable, ReentrancyGuard {
    uint256 casinoCount;
    mapping(uint256 => Casino) public tokenIdToCasino;

    address public casinoNFTAddress;
    address public PLSPAddress;

    address constant usdtAddr = 0x3B00Ef435fA4FcFF5C209a37d1f3dcff37c705aD;
    address constant uniswapV2FactoryAddr = 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f;
    address constant uniswapV2RouterAddr = 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D;
    struct Casino {
        address tokenAddress;
        uint256 liquidity;
        uint256 initialMaxBet;
        uint256 maxBet;
        uint256 fee;
        int256 profit;
        uint256 lastSwapTime;
    }
    struct Bet {
        /* 5: number, 4: even, odd, 3: 18s, 2: 12s, 1: row, 0: black, red */
        uint8 betType;
        uint8 number;
        uint256 amount;
    }

    event RouletteSpinned(uint256 tokenId, address player, uint256 nonce, Bet[] bets, uint256 amount);
    event TransferFailed(uint256 tokenId, address to, uint256 amount);
    event TokenSwapFailed(uint256 tokenId, uint256 balance, string reason, uint256 timestamp);

    constructor(address nftAddr, address _PLSPAddress) {
        casinoNFTAddress = nftAddr;
        PLSPAddress = _PLSPAddress;
    }

    modifier onlyCasinoOwner(uint256 tokenId) {
        require(IERC721(casinoNFTAddress).ownerOf(tokenId) == msg.sender, 'Not Casino Owner');
        _;
    }

    /**
     * @dev adds a new casino
     */
    function addCasino(
        uint256 tokenId,
        address tokenAddress,
        uint256 maxBet,
        uint256 fee
    ) external {
        require(msg.sender == casinoNFTAddress, 'Only casino nft contract can call');

        Casino storage newCasino = tokenIdToCasino[tokenId];
        newCasino.tokenAddress = tokenAddress;
        newCasino.initialMaxBet = maxBet;
        newCasino.maxBet = maxBet;
        newCasino.fee = fee;
        newCasino.liquidity = 0;

        casinoCount++;
    }

    /**
     * @dev set max bet limit for casino
     */
    function setMaxBet(uint256 tokenId, uint256 newMaxBet) external onlyCasinoOwner(tokenId) {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];
        require(newMaxBet <= casinoInfo.initialMaxBet, "Can't exceed initial max bet");

        casinoInfo.maxBet = newMaxBet;
    }

    /**
     * @dev returns maximum reward amount for given bets
     */
    function getMaximumReward(Bet[] calldata bets) public pure returns (uint256) {
        uint256 maxReward;
        uint8[6] memory betRewards = [2, 3, 3, 2, 2, 36];

        for (uint256 i = 0; i < 37; i++) {
            uint256 reward;

            for (uint256 j = 0; j < bets.length; j++) {
                if (_isInBet(bets[j], i)) {
                    reward += bets[j].amount * betRewards[bets[j].betType];
                }
            }
            if (maxReward < reward) {
                maxReward = reward;
            }
        }
        return maxReward;
    }

    /**
     * @dev returns whether Bet `b` covers the `number` or not
     */
    function _isInBet(Bet calldata b, uint256 number) public pure returns (bool) {
        require(b.betType <= 5, 'Invalid bet type');
        require(b.number <= 36, 'Invalid betting number');

        if (number == 0) {
            if (b.betType == 5) {
                return b.number == 0;
            } else {
                return false;
            }
        }

        if (b.betType == 5) {
            return (b.number == number); /* bet on number */
        } else if (b.betType == 4) {
            if (b.number == 0) return (number % 2 == 0); /* bet on even */
            if (b.number == 1) return (number % 2 == 1); /* bet on odd */
        } else if (b.betType == 3) {
            if (b.number == 0) return (number <= 18); /* bet on low 18s */
            if (b.number == 1) return (number >= 19); /* bet on high 18s */
        } else if (b.betType == 2) {
            if (b.number == 0) return (number <= 12); /* bet on 1st dozen */
            if (b.number == 1) return (number > 12 && number <= 24); /* bet on 2nd dozen */
            if (b.number == 2) return (number > 24); /* bet on 3rd dozen */
        } else if (b.betType == 1) {
            if (b.number == 0) return (number % 3 == 0); /* bet on top row */
            if (b.number == 1) return (number % 3 == 1); /* bet on middle row */
            if (b.number == 2) return (number % 3 == 2); /* bet on bottom row */
        } else if (b.betType == 0) {
            if (b.number == 0) {
                /* bet on black */
                if (number <= 10 || (number >= 19 && number <= 28)) {
                    return (number % 2 == 0);
                } else {
                    return (number % 2 == 1);
                }
            } else {
                /* bet on red */
                if (number <= 10 || (number >= 19 && number <= 28)) {
                    return (number % 2 == 1);
                } else {
                    return (number % 2 == 0);
                }
            }
        }
        return false;
    }

    /**
     * @dev returns a nonce between 0 ~ 36
     */
    function _getRandomNumber() internal view returns (uint256) {
        uint256 diff = block.difficulty;
        bytes32 hash = blockhash(block.number - 1);
        uint256 number = uint256(keccak256(abi.encodePacked(block.timestamp, diff, hash))) % 37;

        return number;
    }

    /**
     * @dev returns total bet amount
     */
    function _getTotalBetAmount(Bet[] calldata bets) internal pure returns (uint256) {
        uint256 totalBetAmount;
        for (uint256 i = 0; i < bets.length; i++) {
            totalBetAmount += bets[i].amount;
        }

        return totalBetAmount;
    }

    /**
     * @dev generate a random number and calculate total rewards
     */
    function _spinWheel(Bet[] calldata bets) internal view returns (uint256, uint256) {
        uint256 nonce = _getRandomNumber();
        uint256 totalReward;
        uint8[6] memory betRewards = [2, 3, 3, 2, 2, 36];

        for (uint256 i = 0; i < bets.length; i++) {
            if (_isInBet(bets[i], nonce)) {
                totalReward += betRewards[bets[i].betType] * bets[i].amount;
            }
        }
        return (nonce, totalReward);
    }

    /**
     * @dev place bets and spin the wheel, return reward if user wins
     *
     * NOTE this function only accepts erc20 tokens
     * @param tokenId tokenId of the Casino
     * @param bets array of bets
     */
    function placeBetsWithTokens(uint256 tokenId, Bet[] calldata bets) external nonReentrant {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];
        require(casinoInfo.tokenAddress != address(0), "This casino doesn't support tokens");

        ERC20 token = ERC20(casinoInfo.tokenAddress);
        ERC20 usdtToken = ERC20(usdtAddr);
        uint256 approvedAmount = token.allowance(msg.sender, address(this));
        uint256 totalBetAmount = _getTotalBetAmount(bets);
        uint256 maxReward = getMaximumReward(bets);
        uint256 tokenPrice = getTokenUsdPrice(casinoInfo.tokenAddress);
        uint256 totalUSDValue = (totalBetAmount * tokenPrice) / 10**token.decimals();

        require(token.balanceOf(msg.sender) >= totalBetAmount, 'Not enough balance');
        require(totalBetAmount <= approvedAmount, 'Not enough allowance');
        require(maxReward <= casinoInfo.liquidity + totalBetAmount, 'Not enough liquidity');
        require(totalUSDValue <= casinoInfo.maxBet * 10**usdtToken.decimals(), "Can't exceed max bet limit");

        token.transferFrom(msg.sender, address(this), totalBetAmount);
        casinoInfo.liquidity += totalBetAmount;

        (uint256 nonce, uint256 totalReward) = _spinWheel(bets);

        if (totalReward > 0) {
            token.transfer(msg.sender, totalReward);
            casinoInfo.liquidity -= totalReward;
        }
        casinoInfo.profit = casinoInfo.profit - (int256)(totalReward) + (int256)(totalBetAmount);
        emit RouletteSpinned(tokenId, msg.sender, nonce, bets, totalReward);
    }

    /**
     * @dev place bets and spin the wheel, return reward if user wins
     *
     * NOTE this function only accepts ether
     * @param tokenId tokenId of the Casino
     * @param bets array of bets
     */
    function placeBetsWithEth(uint256 tokenId, Bet[] calldata bets) external payable nonReentrant {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];
        require(casinoInfo.tokenAddress == address(0), 'This casino only support ether');

        ERC20 usdtToken = ERC20(usdtAddr);
        uint256 totalBetAmount = _getTotalBetAmount(bets);
        uint256 maxReward = getMaximumReward(bets);
        uint256 ethUSDprice = getPulsePrice();
        uint256 totalUSDValue = (ethUSDprice * totalBetAmount) / 10**18;

        require(msg.value == totalBetAmount, 'Not correct bet amount');
        require(maxReward <= casinoInfo.liquidity + totalBetAmount, 'Not enough liquidity');
        require(totalUSDValue <= casinoInfo.maxBet * 10**usdtToken.decimals(), "Can't exceed max bet limit");
        casinoInfo.liquidity += totalBetAmount;

        (uint256 nonce, uint256 totalReward) = _spinWheel(bets);

        if (totalReward > 0) {
            bool sent = payable(msg.sender).send(totalReward);
            if (!sent) {
                emit TransferFailed(tokenId, msg.sender, totalReward);
            } else {
                casinoInfo.liquidity -= totalReward;
            }
        }
        casinoInfo.profit = casinoInfo.profit - (int256)(totalReward) + (int256)(totalBetAmount);
        emit RouletteSpinned(tokenId, msg.sender, nonce, bets, totalReward);
    }

    /**
     * @dev adds liquidity to the casino pool
     * NOTE this is only for casinos that uses tokens
     */
    function addLiquidtyWithTokens(uint256 tokenId, uint256 amount) external onlyCasinoOwner(tokenId) {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];
        require(casinoInfo.tokenAddress != address(0), "This casino doesn't support tokens");

        IERC20 token = IERC20(casinoInfo.tokenAddress);
        uint256 approvedAmount = token.allowance(msg.sender, address(this));

        require(approvedAmount >= amount, 'Not enough allowance');
        token.transferFrom(msg.sender, address(this), amount);
        casinoInfo.liquidity += amount;
    }

    /**
     * @dev removes liquidity from the casino pool
     * NOTE this is only for casinos that uses tokens
     */
    function removeLiquidtyWithTokens(uint256 tokenId, uint256 amount) external onlyCasinoOwner(tokenId) {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];
        require(casinoInfo.tokenAddress != address(0), "This casino doesn't support tokens1");

        IERC20 token = IERC20(casinoInfo.tokenAddress);

        require(casinoInfo.liquidity >= amount, 'Not enough liquidity');
        casinoInfo.liquidity -= amount;
        token.transfer(msg.sender, amount);
    }

    /**
     * @dev adds liquidity to the casino pool
     * NOTE this is only for casinos that uses ether
     */
    function addLiquidtyWithEth(uint256 tokenId, uint256 amount) external payable onlyCasinoOwner(tokenId) {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];

        require(casinoInfo.tokenAddress == address(0), "This casino doesn't supports ether");
        require(amount == msg.value, 'Not correct deposit balance');

        casinoInfo.liquidity += msg.value;
    }

    /**
     * @dev removes liquidity from the casino pool
     * NOTE this is only for casinos that uses ether
     */
    function removeLiquidtyWithEth(uint256 tokenId, uint256 amount) external onlyCasinoOwner(tokenId) nonReentrant {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];

        require(casinoInfo.tokenAddress == address(0), "This casino doesn't supports ether");
        require(casinoInfo.liquidity >= amount, 'Not enough liquidity');

        casinoInfo.liquidity -= amount;
        bool sent = payable(msg.sender).send(amount);
    }

    /**
     * @dev update casino's current profit and liquidity.
     */
    function _updateProfitInfo(
        uint256 tokenId,
        uint256 fee,
        uint256 calculatedProfit
    ) internal {
        Casino storage casinoInfo = tokenIdToCasino[tokenId];
        casinoInfo.liquidity -= fee;
        casinoInfo.profit -= int256(calculatedProfit);
        casinoInfo.lastSwapTime = block.timestamp;
    }

    /**
     * @dev get usd price of a token by usdt
     */
    function getTokenUsdPrice(address tokenAddress) public view returns (uint256) {
        IUniswapV2Router02 router = IUniswapV2Router02(uniswapV2RouterAddr);
        IUniswapV2Factory factory = IUniswapV2Factory(uniswapV2FactoryAddr);
        IUniswapV2Pair PLS_Token_Pair = IUniswapV2Pair(factory.getPair(tokenAddress, router.WETH()));
        IUniswapV2Pair PLS_USDT_Pair = IUniswapV2Pair(factory.getPair(router.WETH(), usdtAddr));

        require(address(PLS_Token_Pair) != address(0), 'No pair between token and PLS');
        require(address(PLS_USDT_Pair) != address(0), 'No pair between USDT and PLS');

        ERC20 token = ERC20(tokenAddress);

        address[] memory path = new address[](3);
        path[0] = tokenAddress;
        path[1] = router.WETH();
        path[2] = usdtAddr;
        uint256[] memory amounts = router.getAmountsOut(10**token.decimals(), path);

        return amounts[2];
    }

    /**
     * @dev Gets current pulse price in comparison with PLS and USDT
     */
    function getPulsePrice() public view returns (uint256 price) {
        IUniswapV2Router02 router = IUniswapV2Router02(uniswapV2RouterAddr);
        IUniswapV2Factory factory = IUniswapV2Factory(uniswapV2FactoryAddr);
        IUniswapV2Pair pair = IUniswapV2Pair(factory.getPair(router.WETH(), usdtAddr));
        ERC20 usdtToken = ERC20(usdtAddr);

        (uint256 Res0, uint256 Res1, ) = pair.getReserves();
        price = (Res1 * (10**usdtToken.decimals())) / Res0;
    }

    /**
     * @dev swaps profit fees of casinos into PLSP
     */
    function swapProfitFees() external {
        IUniswapV2Router02 router = IUniswapV2Router02(uniswapV2RouterAddr);
        IUniswapV2Factory factory = IUniswapV2Factory(uniswapV2FactoryAddr);
        address PLSP_pair = factory.getPair(router.WETH(), PLSPAddress);

        require(PLSP_pair != address(0), 'No pair between PLSP and PLS');

        address[] memory path = new address[](2);
        uint256 totalFee;
        uint256 PLSPPool = 0;

        // Swap each token to PULSE
        for (uint256 i = 1; i <= casinoCount; i++) {
            Casino memory casinoInfo = tokenIdToCasino[i];
            IERC20 token = IERC20(casinoInfo.tokenAddress);

            if (casinoInfo.profit <= 0 || casinoInfo.liquidity == 0) continue;

            uint256 availableProfit = uint256(casinoInfo.profit);
            if (casinoInfo.liquidity < availableProfit) {
                availableProfit = casinoInfo.liquidity;
            }

            uint256 balance = (availableProfit * casinoInfo.fee) / 100;

            if (casinoInfo.tokenAddress == address(0)) {
                totalFee += uint256(balance);
                _updateProfitInfo(i, uint256(balance), availableProfit);
                continue;
            }
            if (casinoInfo.tokenAddress == PLSPAddress) {
                PLSPPool += uint256(balance);
                _updateProfitInfo(i, uint256(balance), availableProfit);
                continue;
            }

            path[0] = casinoInfo.tokenAddress;
            path[1] = router.WETH();

            token.approve(address(router), balance);
            try router.swapExactTokensForETH(balance, 0, path, address(this), block.timestamp) returns (
                uint256[] memory swappedAmounts
            ) {
                _updateProfitInfo(i, uint256(swappedAmounts[0]), availableProfit);
                totalFee += swappedAmounts[1];
            } catch Error(string memory reason) {
                emit TokenSwapFailed(i, balance, reason, block.timestamp);
            } catch (bytes memory reason) {
                emit TokenSwapFailed(i, balance, string(reason), block.timestamp);
            }
        }

        if (totalFee > 0) {
            path[0] = router.WETH();
            path[1] = PLSPAddress;

            uint256[] memory amounts = router.swapExactETHForTokens{ value: totalFee }(
                0,
                path,
                address(this),
                block.timestamp
            );
            PLSPPool += amounts[1];

            // burn PLSP
            IPLSP PLSP = IPLSP(PLSPAddress);
            PLSP.burn(PLSPPool);
        }
    }

    receive() external payable {}
}
