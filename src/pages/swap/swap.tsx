import React, { useState, useEffect, useMemo } from "react";
import { BsChevronDown, BsXLg } from "react-icons/bs";
import axios from "axios";
import Dropdown from "rsuite/Dropdown";
import { ReactComponent as DownIcon } from "../../assets/drop.svg";
import USDT from "../../assets/USDT.svg";
import CXS from "../../assets/cxs.svg";
import "rsuite/dist/rsuite.min.css";
import "./swap.css";
import {
  AiFillSetting,
  AiOutlineReload,
  AiOutlineClockCircle,
  AiOutlineLineChart,
  AiOutlineSwap,
} from "react-icons/ai";

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

const Swap = () => {
  const G = useWallet_();
  const global = useSelector((state: any) => state);
  const dispatch = useDispatch();
  const update = (payload: { [key: string]: any }) => {
    dispatch(Slice.actions.update(payload));
  };

  const [receive, setRecieveValue] = useState();
  const [pay, setPayValue] = useState();
  const [item, setItemActive] = useState(false);
  const [migration, setMigration] = useState(false);
  const onReceiveChange = (e: any) => {
    setRecieveValue(e.target.value);
  };

  const onPayChange = (e: any) => {
    setPayValue(e.target.value);
  };

  const selectedMenu = (bool: any) => {
    setItemActive(bool);
  };

  return (
    <>
      {/* bg-[#1b1b1b] */}
      <div className=" fixed top-16 bottom-0 right-0 left-0 bg-[#F6F6F6] overflow-auto">
        <section className="container mx-auto flex flex-col roulette-container mb-10">
          <div className="sm:mt-32  pt-[24px] pr-[30px] pl-[30px] pb-[36px] bg-white dark:bg-[#181818] rounded-[20px] max-w-[450px] mx-auto">
            <div>
              <div className="flex justify-between items-center">
                <div className="flex-3" style={{ flex: 3 }}>
                  <AiOutlineLineChart className="text-2xl" />
                </div>
                <div className="flex-1" style={{ flex: 1 }}>
                  <h1 className=" font-inter text-[#0F0F0F] dark:text-[#F3FEFF] text-[18px] font-semibold">
                    Swap
                  </h1>
                </div>
                <div
                  className="flex-3 flex items-center justify-end gap-3"
                  style={{ flex: 3 }}
                >
                  <AiOutlineClockCircle className="text-2xl" />
                  <AiFillSetting className="text-2xl" />
                  <AiOutlineReload className="text-2xl" />
                </div>
              </div>
              <div className="w-full text-center mb-3">
                <span>Trade tokens in an instant</span>
              </div>
              <p className="font-inter text:[#0f0f0f] dark:text-[#869091] text-[14px] mb-[17px]">
                Select wallet
              </p>
              {/* <div className="flex relative justify-between items-center w-[473px] bg-[#F6F6F6] dark:bg-[#0F0F0F] p-[15px] rounded-[10px] mb-[24px] w-[100%] cursor-pointer">
                <div className="flex items-center">
                  <img src={"Img"} alt="error" />
                  <div className="flex flex-col ml-[20px]">
                    <label className="font-inter text-[#0F0F0F] dark:text-[#DEECE9] text-[15px]">
                      Address
                    </label>
                    <p className="font-inter text-[#869091] text-[13px]">
                      4rID...2dkP
                    </p>
                  </div>
                </div>
              </div> */}

              <p className="font-inter text-[#869091] text-[14px] mb-[8px]">
                You Pay
              </p>
              <div className="flex justify-between items-center w-[473px] bg-[#F6F6F6] dark:bg-[#0F0F0F] p-[15px] rounded-[10px] mb-[24px] w-[100%]">
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <input
                      onChange={(e) => onReceiveChange(e)}
                      value={receive}
                      type="text"
                      onKeyPress={(event) => {
                        if (!/[0-9]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      className="outline-0 font-inter text-[15px] text-[#0F0F0F] dark:text-[#DEECE9] bg-[#F6F6F6] dark:bg-[#0F0F0F] w-[100%]"
                    />
                  </div>
                </div>
                <div className={`show-dropdown flex items-center`}>
                  {item ? (
                    <Dropdown
                      activeKey="1"
                      classPrefix={"flex bg-[#fff] dark:bg-[#0F0F0F] usd"}
                      title={"USDT"}
                      icon={
                        <img
                          src={USDT}
                          className="w-[22px] h-[21px]"
                          style={{ width: "22px", height: "21px" }}
                          alt="error"
                        />
                      }
                    >
                      <Dropdown.Item
                        onSelect={() => selectedMenu(false)}
                        icon={<DownIcon />}
                      >
                        BUSD
                      </Dropdown.Item>
                    </Dropdown>
                  ) : (
                    <Dropdown
                      activeKey="1"
                      classPrefix="flex bg-[#fff] dark:bg-[#0F0F0F] busd"
                      title={"BUSD"}
                      icon={<DownIcon />}
                    >
                      <Dropdown.Item
                        onSelect={() => selectedMenu(true)}
                        icon={
                          <img
                            src={USDT}
                            className="w-[22px] h-[21px]"
                            style={{ width: "22px", height: "21px" }}
                            alt="error"
                          />
                        }
                      >
                        USDT
                      </Dropdown.Item>
                    </Dropdown>
                  )}
                </div>
              </div>
              <div className="flex justify-center">
                <div className="rounded">
                  <AiOutlineSwap className="t text-3xl cursor-pointer" />
                </div>
              </div>
              <p className="font-inter text-[#869091] text-[14px] mb-[8px]">
                You receive
              </p>
              <div className="flex justify-between items-center w-[473px] bg-[#F6F6F6] dark:bg-[#0F0F0F] p-[15px] rounded-[10px] w-[100%]">
                <div className="flex items-center">
                  <div className="flex flex-col">
                    <input
                      onChange={(e) => onPayChange(e)}
                      value={pay}
                      type="text"
                      onKeyPress={(event) => {
                        if (!/[0-9]/.test(event.key)) {
                          event.preventDefault();
                        }
                      }}
                      className="outline-0 font-inter text-[15px] text-[#0F0F0F] dark:text-[#DEECE9] bg-[#F6F6F6] dark:bg-[#0F0F0F] w-[100%]"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <img
                    src={CXS}
                    alt="error"
                    style={{ width: "20px", height: "20px" }}
                  />
                  <p className="font-inter text-[#0F0F0F] dark:text-[#F3FEFF] text-[15px] pr-[7.5px] pl-[10px]">
                    {migration ? "Nextep Nxchain" : "CXS Token"}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <button className="w-[235px] pt-[15px] pb-[15px] bg-[#C629EC] text-[14px] text-[#ffff] font-inter rounded-[5px] mt-[27px] w-[100%]">
                SWAP
              </button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
export default Swap;
