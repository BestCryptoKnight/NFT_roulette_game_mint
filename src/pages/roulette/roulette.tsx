import React, { useState, useEffect, useMemo } from "react";
import { BsChevronDown, BsXLg } from "react-icons/bs";
import axios from "axios";
import "./roulette.css";
import {
  tips,
  simpleAddress,
  toHex,
  fromBigNum,
  toBigNum,
  USD,
} from "../../util";
import useWallet_ from "../../useWallet";
import { ethers } from "ethers";
import { useSelector, useDispatch } from "react-redux";
import Swal from "sweetalert2";
import Slice from "../../reducer";
import BetModal from "../../component/BetModal";
import { useParams } from "react-router-dom";

interface bettingDataType {
  value: number;
  type: any;
  bettingX: number;
}
interface NFTDateType {
  tokenAddress: string;
  liquidity: number;
  initialMaxBet: number;
  maxBet: number;
  fee: number;
  profit: number;
  lastSwapTime: number;
  onwerAddress: string;
}

interface AddclassType {
  event: any;
  index: number;
  select: number;
}

enum BetNames {
  Row1 = "Row 1",
  Row2 = "Row 2",
  Row3 = "Row 3",
  First12 = "1 st 12",
  Second12 = "2 nd 12",
  Third12 = "3 rd 12",
  First18 = "1 to 18",
  Second18 = "19 to 36",
  Black = "BLACK",
  Red = "RED",
  Odd = "ODD",
  Even = "EVEN",
}

// tokenIdToCasino
let bettingData: bettingDataType[] = []; // display data
let bets: any[] = []; //real data for contract request

const PlsRoulette = () => {
  const G = useWallet_();
  const global = useSelector((state: any) => state);
  const dispatch = useDispatch();
  const update = (payload: { [key: string]: any }) => {
    dispatch(Slice.actions.update(payload));
  };
  let { id } = useParams();
  useEffect(() => {
    console.log("id  :");
    console.log(id);
    update({ tokenId: id });
  }, [id]);

  const [toggle, setToggle] = useState(false);
  const [number, setNumber] = useState<number>(36);
  const [bettingParam, setBettingParam] = useState<any>("");
  const [bettingModal, setBettingModal] = useState<boolean>(false);
  const [is3X, setIs3X] = useState(false);
  const [betType, setBetType] = useState<number>(0);
  const [betNumber, setBetNumber] = useState<number>(0);
  const [bettingValue, setBettingValue] = useState<number>();
  const [bettingHistory, setBettingHistory] = useState<any>([]);
  const [isWin, setIsWin] = useState<string>("");

  // NFT
  const [nftData, setNftDate] = useState<NFTDateType>({
    tokenAddress: "",
    liquidity: 0,
    initialMaxBet: 0,
    maxBet: 0,
    fee: 0,
    profit: 0,
    lastSwapTime: 0,
    onwerAddress: "",
  });

  const set = (attrs: Partial<NFTDateType>) =>
    setNftDate({ ...nftData, ...attrs });

  const getData = async () => {
    let onwerAddress: any = await G.getOwner();
    let value = await G.getCasinoInfoWithTokenId(global.tokenId); // Token ID 2 is temporary for pls-roulette
    const {
      fee,
      profit,
      initialMaxBet,
      lastSwapTime,
      liquidity,
      maxBet,
      tokenAddress,
    }: any = value;
    set({
      fee,
      profit,
      initialMaxBet,
      lastSwapTime,
      liquidity,
      maxBet,
      tokenAddress,
      onwerAddress,
    });
    getHistory();
  };

  const getHistory = async () => {
    try {
      console.log("getHistory :");
      if (global.address) {
        const response = await axios.post(
          process.env.REACT_APP_ENDPOINT + "/history/getHistory",
          {
            address: global.address,
          }
        );
        console.log(response.data);
        setBettingHistory(response.data);
      }
    } catch (error) {
      console.log("getHistory");
      console.log(error);
    }
  };

  // only owner
  const [liquidity, setLiquidity] = useState<number>(0);
  const [maxBetAmount, setMaxBetAmount] = useState<number>(0);

  const SetLiquidityCall = async () => {
    try {
      if (liquidity <= 0) {
        return tips("Please set the liquidity integer amount");
      }
      let result = await G.ownerAddLiquidity(
        global.tokenId,
        toBigNum(liquidity, global.tokenDecimals)
      );
      console.log("SetLiquidityCall");
      console.log(result);
    } catch (error) {
      console.log("SetLiquidityCall : ");
      console.log(error);
    }
  };

  const SetMaxBetAmountCall = async () => {
    try {
      if (maxBetAmount <= 0) {
        return tips("Please set the maximun bet integer amount");
      }
      let result = await G.ownerAddMaxbet(global.tokenId, maxBetAmount);
      console.log("SetMaxBetAmountCall");
      console.log(result);
    } catch (error) {
      console.log("SetMaxBetAmountCall : ");
      console.log(error);
    }
  };

  // mornitoring...
  const [time, setTime] = useState(+new Date());
  useEffect(() => {
    getData();
    const timer = setTimeout(() => setTime(+new Date()), 10000);
    return () => clearTimeout(timer);
  }, [time]);

  useEffect(() => {
    getHistory();
  }, [global.address]);

  // ***************************************************
  const bettingNow = async () => {
    console.log("totalBetAmount : ", totalBettingAmount());
    if (totalBettingAmount() < 0 || totalBettingAmount() === 0) {
      return tips("Please set betting");
    }
    console.log(
      getMaximumReward(),
      fromBigNum(nftData.liquidity, global.tokenDecimals)
    );

    if (
      getMaximumReward() > fromBigNum(nftData.liquidity, global.tokenDecimals)
    ) {
      return Swal.fire({
        title: "Notification",
        text: `You maximum reward is bigger than liquidity pool. Please select lower value`,
        showCancelButton: false,
        icon: "warning",
      });
    }
    if (
      totalBettingAmount() > fromBigNum(nftData.liquidity, global.tokenDecimals)
    ) {
      return Swal.fire({
        title: "Notification",
        text: `liquidity pool is not enough to give you reward`,
        showCancelButton: false,
        icon: "warning",
      });
    }
    let res: any;
    if (
      totalBettingAmount() < fromBigNum(nftData.liquidity, global.tokenDecimals)
    ) {
      res = await G.rouletteBetting(
        bets,
        toBigNum(totalBettingAmount(), global.tokenDecimals)
      );
      //  res = tokenId, msg.sender, nonce, bets, totalReward
    }
    if (res) {
      console.log("RouletteSpinned Event : ");
      console.log(res);
      let success = false;
      setIsWin("lose");
      const totalBetAmount = res.bets.reduce(
        (sum: number, data: any) =>
          sum + fromBigNum(data.amount, global.tokenDecimals),
        0
      );
      console.log(totalBetAmount, fromBigNum(res.amount, global.tokenDecimals));

      if (totalBetAmount < fromBigNum(res.amount, global.tokenDecimals)) {
        success = true;
        setIsWin("win");
      }
      getHistory(); //history data
      Swal.fire({
        title: `You have ${success ? "Won" : "Failed"}!`,
        text: `Nonce is ${res.nonce}.${
          success
            ? " Reward: " +
              fromBigNum(res.amount, global.tokenDecimals) +
              "TTok1"
            : ""
        }`,
        showCancelButton: false,
        icon: success ? "success" : "error",
      });
      update({ nonce: res.nonce });

      getData();
      G.monitoring();
    }
  };

  const formatBettingData = () => {
    bettingData = [];
    bets = [];
    setBettingParam("");
    setIs3X(false);
    setBetType(0);
    setBetNumber(0);
  };

  const Addbetting = (bettingValue_: any) => {
    try {
      if (bettingValue_ <= 0) {
        return tips("Please enter correct betting amount");
      }
      let bettingX: number = 0;
      if (typeof bettingParam === "number") {
        bettingX = 36;
      } else {
        is3X ? (bettingX = 3) : (bettingX = 2);
      }
      let newBetting: bettingDataType = {
        value: bettingValue_,
        type: bettingParam,
        bettingX: bettingX,
      }; //for frontend display
      bettingData.push(newBetting);

      console.log("bettingData : ");
      console.log(bettingData);

      let newBettingArray = [
        betType,
        betNumber,
        (bettingValue_ * 1e18).toString(),
      ]; //for contract data
      bets.push(newBettingArray);
      console.log(bets);

      setBetType(0);
      setBetNumber(0);
      setBettingModal(!bettingModal);
      setIs3X(false);
      setBettingValue(0);
    } catch (error) {
      console.log("Addbetting : ");
      console.log(error);
    }
  };

  const isSelectedInBet = (type: any) => {
    for (let i = 0; i < bettingData.length; i++) {
      if (bettingData[i].type === type) {
        return true;
      }
    }
    return false;
  };

  const _isInBet = (b: any, number: number) => {
    if (number === 0) {
      if (b.betType === 5) {
        return b.number === 0;
      } else {
        return false;
      }
    }

    if (b.betType === 5) {
      return b.number === number; /* bet on number */
    } else if (b.betType === 4) {
      if (b.number === 0) return number % 2 === 0; /* bet on even */
      if (b.number === 1) return number % 2 === 1; /* bet on odd */
    } else if (b.betType === 3) {
      if (b.number === 0) return number <= 18; /* bet on low 18s */
      if (b.number === 1) return number >= 19; /* bet on high 18s */
    } else if (b.betType === 2) {
      if (b.number === 0) return number <= 12; /* bet on 1st dozen */
      if (b.number === 1)
        return number > 12 && number <= 24; /* bet on 2nd dozen */
      if (b.number === 2) return number > 24; /* bet on 3rd dozen */
    } else if (b.betType === 1) {
      if (b.number === 0) return number % 3 === 0; /* bet on top row */
      if (b.number === 1) return number % 3 === 1; /* bet on middle row */
      if (b.number === 2) return number % 3 === 2; /* bet on bottom row */
    } else if (b.betType === 0) {
      if (b.number === 0) {
        /* bet on black */
        if (number <= 10 || (number >= 19 && number <= 28)) {
          return number % 2 === 0;
        } else {
          return number % 2 === 1;
        }
      } else {
        /* bet on red */
        if (number <= 10 || (number >= 19 && number <= 28)) {
          return number % 2 === 1;
        } else {
          return number % 2 === 0;
        }
      }
    }
    return false;
  };

  const getMaximumReward = () => {
    let maxReward = 0;
    const betRewards = [2, 3, 3, 2, 2, 36];
    console.log(bets);
    for (let i = 0; i < 37; i++) {
      let reward = 0;
      for (let j = 0; j < bets.length; j++) {
        const bet = {
          betType: bets[j][0],
          number: bets[j][1],
          amount: Number.parseFloat(ethers.utils.formatEther(bets[j][2])),
        };
        if (_isInBet(bet, i)) {
          reward += bet.amount * betRewards[bet.betType];
        }
      }
      if (maxReward < reward) {
        maxReward = reward;
      }
    }
    return maxReward;
  };

  const rouletteNumber = () => {
    let partNumber: number = 1;
    let part: number = 9;
    let part_: number = 9;
    let class_: string = "";
    const rows = [];

    const red: string = "py-1 px-1 bg-red-600 text-white text-lg rounded-xl";
    const black: string = "py-1 px-1 bg-black text-white text-lg rounded-xl";
    const box: string =
      "border-solid border border-white p-1 text-center cursor-pointer";
    const rNumber: string = "md:rotate-90";

    for (let i: number = 1; i <= number; i++) {
      if (partNumber % 2 !== 0) {
        //odd part
        i % 2 === 0 ? (class_ = black) : (class_ = red);
      } else {
        //even part
        if (part + 1 - part_ * (partNumber - 1) === i % 18) {
          rows.push(
            <div
              key={i}
              id={`${i}`}
              onClick={(e: any) => {
                setBetType(5);
                setBetNumber(i);
                setBettingParam(i);
                openModal(i);
              }}
              className={`${box} ${getBorderClassName(i)}`}
            >
              <div className={black}>
                {" "}
                <p className={rNumber}>{i}</p>
              </div>
            </div>
          );
          continue;
        }
        i % 2 !== 0 ? (class_ = black) : (class_ = red);
      }

      rows.push(
        <div
          key={i}
          id={`${i}`}
          onClick={(e: any) => {
            setBetType(5);
            setBetNumber(i);
            setBettingParam(i);
            openModal(i);
          }}
          className={`${box} ${getBorderClassName(i)}`}
        >
          <div className={class_}>
            {" "}
            <p className={rNumber}>{i}</p>
          </div>
        </div>
      );
      if (i % part_ === 0) {
        partNumber = partNumber + 1;
        part = part_ * partNumber;
      }
    }
    return <>{rows}</>;
  };

  const totalBettingAmount = () => {
    let total: number = 0;
    for (let i = 0; i < bettingData.length; i++) {
      if (bettingData[i].value) {
        total += Number(bettingData[i].value);
      }
    }
    return total;
  };

  const removeBetting = (index: number) => {
    console.log(index);
    console.log(bettingData);
    bettingData.splice(index, 1);
    bets.splice(index, 1);
  };

  const openModal = (type: any) => {
    console.log(type);
    if (!isSelectedInBet(type)) {
      setBettingModal(!bettingModal);
    } else {
      const index = bettingData.findIndex((data) => data.type === type);
      bettingData.splice(index, 1);
      bets.splice(index, 1);
    }
  };

  const isRed = (number: number) => {
    if (number <= 10 || (number >= 19 && number <= 28)) {
      return number % 2 === 1;
    } else {
      return number % 2 === 0;
    }
  };

  const getBorderClassName = (type: any) => {
    return isSelectedInBet(type) ? "active" : "";
  };
  return (
    <>
      <section className="container mx-auto flex flex-col roulette-container mb-10">
        {/* If you are owner of this game, you can set liquidity and max bet  */}
        <div className="">
          {nftData.onwerAddress &&
          global.address &&
          global.address.toLowerCase() ===
            nftData.onwerAddress.toLowerCase() ? (
            <div className="flex items-center justify-between mt-4 x-full py-5 rounded-lg grey-bg p-4 border-solid flex-col md:flex-row gap-1">
              <div className="w-full flex gap-4 items-center justify-start">
                <div className="">
                  <input
                    placeholder="Liquidity Amount"
                    type="number"
                    className="owner-input"
                    onChange={(e): any => {
                      setLiquidity(Number(e.target.value));
                    }}
                    defaultValue={liquidity}
                  />
                </div>
                <div className="">
                  <button onClick={SetLiquidityCall} className="owner-btn">
                    Add Liquidity
                  </button>
                </div>
              </div>
              <div className="w-full flex gap-4 items-center justify-start">
                <div className="">
                  <input
                    type="number"
                    placeholder="Maximun Bet Amount"
                    className="owner-input"
                    onChange={(e): any => {
                      setMaxBetAmount(Number(e.target.value));
                    }}
                    defaultValue={maxBetAmount}
                  />
                </div>
                <div className="">
                  <button onClick={SetMaxBetAmountCall} className="owner-btn">
                    Set
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <></>
          )}
        </div>

        {/* display user info*/}
        <div className="flex items-center justify-between mt-4 x-full py-5 rounded-lg grey-bg p-4 border-solid flex-col md:flex-row">
          <div className="">
            <div className="font-bold">
              <a
                className="underline"
                href={`https://rinkeby.etherscan.io/address/${nftData.onwerAddress}`}
                target={"_blank"}
              >
                Owner:{" "}
                {nftData.onwerAddress.length > 0 ? (
                  simpleAddress(nftData.onwerAddress)
                ) : (
                  <></>
                )}
              </a>
            </div>
            <div className="font-bold">
              Profit loss 24h:{" "}
              <span className="green-color">
                {
                  // 24h profit % = profit / (liquidity - profit) * 100%
                  nftData.profit == 0
                    ? 0
                    : nftData.profit &&
                      (
                        (fromBigNum(nftData.profit, 18) /
                          (fromBigNum(nftData.liquidity, 18) -
                            fromBigNum(nftData.profit, 18))) *
                        100
                      ).toFixed(4)
                }
                %
              </span>
            </div>
          </div>
          <div className="w-full md:w-fit my-2 md:my-0">
            <div className=" flex flex-col items-center p-2 bg-white rounded-lg shadow-md">
              <div className="">Current liquidity</div>
              <div className="flex items-center font-bold gap-2">
                <div className="">
                  {fromBigNum(nftData.liquidity, 18)}{" "}
                  {global.tokenSymbol && global.tokenSymbol}
                </div>
                <img
                  src="/assets/images/USDC.svg"
                  alt="USDC"
                  width={"20px"}
                  height={"20px"}
                />
                <div className="">
                  {nftData.liquidity &&
                    USD(fromBigNum(nftData.liquidity, 18), global.tokenUSD)}
                  {/* &nbsp;USDC */}
                </div>
              </div>
            </div>
          </div>
          <div className="">
            <div className="font-bold">
              Minimum bet :{" "}
              <span className="">
                {" "}
                {1}$( = &nbsp;
                <span className="text-green-600">
                  {(1 / global.tokenUSD).toFixed(2)}&nbsp;{global.tokenSymbol}
                </span>
                )
              </span>
            </div>
            <div className="font-bold">
              Maximum bet :{" "}
              <span className="">
                {" "}
                {nftData.maxBet}$( = &nbsp;
                <span className="text-green-600">
                  {(nftData.maxBet / global.tokenUSD).toFixed(2)}&nbsp;
                  {global.tokenSymbol}
                </span>
                )
              </span>
            </div>
          </div>
        </div>
        {/* betting info */}
        <div className="flex flex-col mt-14 z-10">
          <div className="mx-auto font-bold green-color text-lg animation-effect animate-bounce">
            {isWin === "win" ? "😀" : isWin === "lose" ? "☹" : ""}
          </div>
          {global.nonce ? (
            <div className="mx-auto">
              <div
                className={`rounded-lg ${
                  isRed(global.nonce) ? "bg-red-600" : "bg-black"
                }  py-4 px-10`}
              >
                <h1 className="text-white text-6xl">{global.nonce}</h1>
              </div>
            </div>
          ) : (
            <></>
          )}
          <div className="mx-auto pt-2 flex items-center justify-start gap-1">
            History:
            {bettingHistory
              .slice(
                bettingHistory.length > 6 ? bettingHistory.length - 6 : 0,
                bettingHistory.length
              )
              .map((data: any, index: number) => (
                <div
                  key={index}
                  className={`rounded-md text-white w-8 text-center ${
                    isRed(data.nonce) ? "bg-red-600" : "bg-black"
                  }`}
                >
                  {data.nonce}
                </div>
              ))}
          </div>
        </div>
        {/* betting panel */}
        <div className="mt-3 flex justify-center md:-rotate-90 md:-my-32 z-0 animation-effect">
          <div className="bg-green-700 py-16 sm:px-16 px-7">
            <div
              onClick={(e: any) => {
                setBetType(5);
                setBetNumber(0);
                setBettingParam(0);
                openModal(0);
              }}
              className={`cursor-pointer border-solid border-2 border-b-0 border-white p-1 text-white text-center text-lg ${getBorderClassName(
                0
              )}`}
            >
              0
            </div>
            <div className="flex justify-start w-full">
              <div className="flex items-center justify-center flex-col border-solid border-2 border-r-0 border-white text-white text-md">
                <div className="flex items-center justify-center flex-1 gap-y-3 border-solid border-white border-b-2">
                  <div className="flex h-full items-center justify-around gap-x-3 flex-col border-solid border-white border-r-2 relative width-50px">
                    <div
                      onClick={(e: any) => {
                        setBetType(3);
                        setBetNumber(0);
                        setIs3X(true);
                        setBettingParam(BetNames.First18);
                        openModal(BetNames.First18);
                      }}
                      className={`cursor-pointer rotate-90 ${getBorderClassName(
                        BetNames.First18
                      )}`}
                    >
                      1&nbsp;to&nbsp;18
                    </div>
                    <div
                      onClick={(e: any) => {
                        setBetType(4);
                        setBetNumber(1);
                        setBettingParam(BetNames.Odd);
                        openModal(BetNames.Odd);
                      }}
                      className={`cursor-pointer rotate-90 ${getBorderClassName(
                        BetNames.Odd
                      )}`}
                    >
                      ODD
                    </div>
                    <div className="width-50px border-solid border-white border absolute"></div>
                  </div>
                  <div
                    onClick={(e: any) => {
                      setBetType(2);
                      setBetNumber(0);
                      setIs3X(true);
                      setBettingParam(BetNames.First12);
                      openModal(BetNames.First12);
                    }}
                    className={`cursor-pointer rotate-90 w-full width-50px ${getBorderClassName(
                      BetNames.First12
                    )}`}
                  >
                    1 st 12
                  </div>
                </div>

                <div className="flex items-center justify-center flex-1 gap-y-3 border-solid border-white border-b-2">
                  <div className="flex h-full items-center justify-around gap-x-3 flex-col border-solid border-white border-r-2 relative width-50px">
                    <div className="rotate-90">
                      <div className="scale-y-50">
                        <div
                          onClick={(e: any) => {
                            setBetType(0);
                            setBetNumber(1);
                            setBettingParam(BetNames.Red);
                            openModal(BetNames.Red);
                          }}
                          className={`cursor-pointer border-solid border-white border translate-x-1 px-4 py-4 rotate-45 bg-red-600 ${getBorderClassName(
                            BetNames.Red
                          )}`}
                        ></div>
                      </div>
                    </div>
                    <div className="rotate-90">
                      <div className="scale-y-50">
                        <div
                          onClick={(e: any) => {
                            setBetType(0);
                            setBetNumber(0);
                            setBettingParam(BetNames.Black);
                            openModal(BetNames.Black);
                          }}
                          className={`cursor-pointer border-solid border-white border translate-x-1 px-4 py-4 rotate-45 bg-black ${getBorderClassName(
                            BetNames.Black
                          )}`}
                        ></div>
                      </div>
                    </div>
                    <div className="width-50px border-solid border-white border absolute"></div>
                  </div>
                  <div
                    onClick={(e: any) => {
                      setBetType(2);
                      setBetNumber(1);
                      setIs3X(true);
                      setBettingParam(BetNames.Second12);
                      openModal(BetNames.Second12);
                    }}
                    className={`cursor-pointer rotate-90 w-full width-50px ${getBorderClassName(
                      BetNames.Second12
                    )}`}
                  >
                    2&nbsp;nd12
                  </div>
                </div>

                <div className="flex items-center justify-center flex-1 gap-y-3 border-solid border-white ">
                  <div className="flex h-full items-center justify-around gap-x-3 flex-col border-solid border-white border-r-2 relative width-50px">
                    <div
                      onClick={(e: any) => {
                        setBetType(3);
                        setBetNumber(1);
                        setBettingParam(BetNames.Second18);
                        openModal(BetNames.Second18);
                      }}
                      className={`cursor-pointer rotate-90 ${getBorderClassName(
                        BetNames.Second18
                      )}`}
                    >
                      19&nbsp;to&nbsp;36
                    </div>
                    <div
                      onClick={(e: any) => {
                        setBetType(4);
                        setBetNumber(0);
                        setBettingParam(BetNames.Even);
                        openModal(BetNames.Even);
                      }}
                      className={`cursor-pointer rotate-90 ${getBorderClassName(
                        BetNames.Even
                      )}`}
                    >
                      EVEN
                    </div>
                    <div className="width-50px border-solid border-white border absolute"></div>
                  </div>
                  <div
                    onClick={(e: any) => {
                      setBetType(2);
                      setBetNumber(2);
                      setBettingParam(BetNames.Third12);
                      openModal(BetNames.Third12);
                    }}
                    className={`cursor-pointer rotate-90 w-full width-50px ${getBorderClassName(
                      BetNames.Third12
                    )}`}
                  >
                    3&nbsp;rd&nbsp;12
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 border-solid border border-white w-full">
                {rouletteNumber()}
              </div>
            </div>
            <div className="flex">
              <div className="width-102px"></div>
              <div
                onClick={(e: any) => {
                  setBetType(1);
                  setBetNumber(1);
                  setIs3X(true);
                  setBettingParam(BetNames.Row1);
                  openModal(BetNames.Row1);
                }}
                className={`cursor-pointer border-solid border-2 border-t-0 border-white p-1 text-white text-center text-lg ${getBorderClassName(
                  BetNames.Row1
                )}`}
              >
                2 to 1
              </div>
              <div
                onClick={(e: any) => {
                  setBetType(1);
                  setBetNumber(2);
                  setIs3X(true);
                  setBettingParam(BetNames.Row2);
                  openModal(BetNames.Row2);
                }}
                className={`cursor-pointer border-solid border-b-2 border-t-0 border-white p-1 text-white text-center text-lg ${getBorderClassName(
                  BetNames.Row2
                )}`}
              >
                2 to 1
              </div>
              <div
                onClick={(e: any) => {
                  setBetType(1);
                  setBetNumber(0);
                  setIs3X(true);
                  setBettingParam(BetNames.Row3);
                  openModal(BetNames.Row3);
                }}
                className={`cursor-pointer border-solid border-2 border-t-0 border-white p-1 text-white text-center text-lg ${getBorderClassName(
                  BetNames.Row3
                )}`}
              >
                2 to 1
              </div>
            </div>
          </div>
        </div>

        {/* user money */}
        <div className="flex mx-auto pt-1">
          <div className="text-black text-xl font-extrabold text-center sm:text-left">
            User Balance&nbsp;:&nbsp;
            {global.balance && fromBigNum(global.balance, 18)}
            &nbsp;{global.tokenSymbol && global.tokenSymbol} &nbsp;
            {USD(fromBigNum(global.balance, 18), global.tokenUSD)}
          </div>
        </div>
        <div className="flex mx-auto">
          <div className="text-black text-xl font-extrabold text-center sm:text-left">
            Total betting&nbsp;:&nbsp;
            {totalBettingAmount()}&nbsp; {global.tokenSymbol}&nbsp;
            <br className="sm:hidden flex" />
            {USD(totalBettingAmount(), global.tokenUSD)}
          </div>
        </div>
        {/* set betting */}
        <div className="z-10 flex flex-col">
          <div className="flex items-center justify-start flex-col gap-6 mt-10">
            {bettingData.map((bet, index) => (
              <div
                key={index}
                className="flex items-center justify-between w-full flex-col sm:flex-row gap-2"
              >
                <div className="flex items-center sm:justify-start justify-between gap-2 sm:w-auto w-full">
                  <div className="flex items-center justify-between rounded-lg px-3 py-3 grey-bg gap-3 text-lg font-bold w-[130px]">
                    <div className="flex items-center justify-start gap-2">
                      {bet.type === "BLACK" ? (
                        <div className="rounded-md bg-black px-4 py-3"></div>
                      ) : bet.type === "RED" ? (
                        <div className="rounded-md bg-red-700 px-4 py-3"></div>
                      ) : (
                        <></>
                      )}
                      {Number.isInteger(bet.type) &&
                        (!isRed(bet.type) ? (
                          <div className="rounded-md bg-black px-4 py-3"></div>
                        ) : (
                          <div className="rounded-md bg-red-700 px-4 py-3"></div>
                        ))}
                      {bet.type}
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-3 grey-bg gap-3 text-lg font-bold green-color">
                    <span className="b text-black">X</span> {bet.bettingX}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center sm:justify-between justify-start w-auto rounded-lg px-3 py-3 grey-bg text-lg font-bold gap-1">
                    <div className=""></div>
                    <div className="border-b border-solid sm:flex-none flex-1 border-gray-300">
                      <input
                        type="number"
                        defaultValue={Number(bet.value)}
                        onChange={(e: any) => {
                          bettingData[index].value = Number(e.target.value);
                          bets[index][2] = toBigNum(e.target.value, 18);
                          setToggle(!toggle);
                        }}
                        className="flex-1 font-bold text-gray-700 bg-transparent w-20"
                      />
                    </div>
                    <img
                      src="/assets/images/USDC.svg"
                      alt=""
                      width="20px"
                      height="20px"
                    />
                    <div className="">{USD(bet.value, global.tokenUSD)}</div>
                  </div>
                  <div className="hover:text-red-700 hover:scale-110 cursor-pointer text-xl">
                    <BsXLg
                      onClick={() => {
                        openModal(bet.type);
                        getData();
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button onClick={bettingNow} className="bet-btn">
          Bet now
        </button>
        {bettingModal ? (
          <BetModal
            setBettingModal={setBettingModal}
            bettingModal={bettingModal}
            setBettingValue={setBettingValue}
            bettingValue={bettingValue}
            Addbetting={Addbetting}
          />
        ) : (
          <></>
        )}
      </section>
    </>
  );
};
export default PlsRoulette;
