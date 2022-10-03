import { ethers } from "ethers";
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { rouletteContract } from "../contract";
import NFTContact from "../contract/abi/nft.json";
import Slice from "../reducer";
import { tips } from "../util";
import { RPCS, supportChainId } from "../config/global.const";

export const DISCONNECTED = "disconnected";
export const CONNECTING = "connecting";
export const CONNECTED = "connected";
/* export const getWeb3 = ()=>window.Web3; */
export const ZERO = "0x0000000000000000000000000000000000000000";
export const toHex = (val: string | number): string =>
  new window.Web3().utils.toHex(val);
export const validAddress = (address: string): boolean =>
  new window.Web3().isAddress(address);
export const fromEther = (v: number, p?: number) =>
  "0x" +
  (BigInt(Math.round(v * 1e6)) * BigInt(10 ** ((p || 18) - 6))).toString(16);
export const toEther = (v: number | string, p?: number) =>
  Number(BigInt(v) / BigInt(10 ** ((p || 18) - 6))) / 1e6;

const AppKey = process.env.REACT_APP_GTAG || "";
const proxy = process.env.REACT_APP_ENDPOINT || "";
const ERR_INSTALL =
  "  You must install Metamask into your browser: https://metamask.io/download.html";
const ERR_DISCONNECTED = "  walllet disconnected";
const ERR_NOACCOUNTS = "  No selected address.";
const ERR_UNKNOWN = "  Unknown error";
const ERR_ASKCONNECT =
  "  Connect to Metamask using the button on the top right.";
const ERR_CANCELLED = "  You cancelled requested operation.";
const ERR_CHAINID = "  Invalid chain id #:chainId";

export const request = async (
  url: string,
  params?: any
): Promise<ServerResponse | null> => {
  try {
    const result = await fetch(proxy + url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: params ? JSON.stringify(params) : null,
    });
    return await result.json();
  } catch (error) {
    console.log(error);
  }
  return null;
};

// const useWallet_ = (): UseWalletTypes => {
const useWallet_ = () => {
  const G = useSelector((state: any) => state);
  const L = G.L;
  const dispatch = useDispatch();
  const update = (payload: { [key: string]: any }) => {
    dispatch(Slice.actions.update(payload));
  };

  const connected = CONNECTED;
  const monitoring = async () => {
    let symbol = await call(
      NFTContact.usdc.address,
      NFTContact.usdc.abi,
      "symbol",
      []
    );
    let tokenDecimals = await call(
      NFTContact.usdc.address,
      NFTContact.usdc.abi,
      "decimals",
      []
    );
    let usdtDecimals = await call(
      NFTContact.usdt.address,
      NFTContact.usdt.abi,
      "decimals",
      []
    );
    let tokenUSD = await call(
      NFTContact.roulette.address,
      NFTContact.roulette.abi,
      "getTokenUsdPrice",
      [NFTContact.usdc.address]
    );
    console.log("tokenUSD: ", tokenUSD);
    if (G.address.length > 0) {
      let bal = await call(
        NFTContact.usdc.address,
        NFTContact.usdc.abi,
        "balanceOf",
        [G.address]
      );
      update({ address: G.address, balance: bal });
    }
    //  else {
    //     update({ address: '' })
    // }
    update({
      tokenSymbol: symbol,
      tokenUSD: ethers.utils.formatUnits(tokenUSD, usdtDecimals),
      usdtDecimals: Number.parseInt(usdtDecimals),
      tokenDecimals: Number.parseInt(tokenDecimals),
    });
  };
  React.useEffect(() => {
    monitoring();
    // update({ status: DISCONNECTED, err: ERR_DISCONNECTED })
    console.log("Chain Id :");
    console.log(G.chainId);
    if (G.chainId !== supportChainId) {
      changeNetwork(supportChainId);
    }
  }, [G.chainId, G.address, G.balance]);

  React.useEffect(() => {
    _connect();
  }, []);

  React.useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on("accountsChanged", accountChanged);
      ethereum.on("chainChanged", chainChanged);
    }
  });

  const getPending = (): { pending: PendingTypes; txs: TxTypes } => {
    let pending: PendingTypes = {};
    let txs: TxTypes = {};
    try {
      let buf = window.localStorage.getItem(AppKey);
      if (buf) pending = JSON.parse(buf);
      buf = window.localStorage.getItem(AppKey + "-txs");
      if (buf) txs = JSON.parse(buf);
    } catch (err) {
      console.log(err);
    }
    return { pending, txs };
  };

  // const setPending = (key: string, tx: PendingType) => {
  //     const pending: PendingTypes = { ...G.pending, [key]: tx }
  //     window.localStorage.setItem(AppKey, JSON.stringify(pending))
  //     update({ pending })
  // }
  // const setTxs = (txs: TxTypes) => {
  //     window.localStorage.setItem(AppKey + '-txs', JSON.stringify(txs))
  //     update({ txs })
  // }

  // const removePending = (txId: string) => {
  //     try {
  //         let pending = getPending()
  //         delete pending[txId]
  //         window.localStorage.setItem(AppKey, JSON.stringify(pending))
  //     } catch (err) {
  //         console.log(err)
  //     }
  // }
  const call = async (
    to: string,
    abi: any,
    method: string,
    args: Array<string | number | boolean>,
    rpc?: string
  ): Promise<any> => {
    try {
      if (window.ethereum) {
        const web3 = new window.Web3(G.rpc);
        const contract = new web3.eth.Contract(abi, to);
        return await contract.methods[method](...args).call();
      } else {
        console.log("No metamask");
      }
    } catch (error: any) {
      console.log("call : ");
      console.log(error);
    }
  };

  const send = async (
    to: string,
    abi: any,
    value: string,
    method: string,
    args: Array<string | number | boolean>
  ): Promise<string | undefined> => {
    let err = "";
    try {
      const { ethereum } = window;
      if (ethereum && ethereum.isConnected) {
        const web3 = new window.Web3(G.rpc);
        const contract = new web3.eth.Contract(abi, to);
        const data = contract.methods[method](...args).encodeABI();
        console.log(G);
        const json = { from: G.address, to, value, data };
        const res = await ethereum.request({
          method: "eth_sendTransaction",
          params: [json],
        });
        if (res) return res;
        err = ERR_UNKNOWN;
      } else {
        err = ERR_ASKCONNECT;
      }
    } catch (error: any) {
      //   if (error.code === 4001) {
      //     err = ERR_CANCELLED;
      //   } else if (error.code === -32603) {
      //     const matches = error.message.match(/'(\{[^']*\})'/);
      //     if (matches.length === 2) {
      //       let json: any;
      //       try {
      //         json = JSON.parse(matches[1]);
      //         if (json.value && json.value.data) {
      //           const { code, message } = json.value.data;
      //           err = "  " + message + " (" + code + ")";
      //         } else {
      //           err = "  " + error.message;
      //         }
      //       } catch (err1) {
      //         err = "  " + error.message;
      //       }
      //     } else {
      //       err = "  " + error.message;
      //     }
      //   } else {
      //     err = "  " + error.message;
      //   }
      console.log(error);
    }
    throw new Error(err);
  };
  const _connect = async (accounts?: Array<string>) => {
    let err = "";
    try {
      const { ethereum } = window;
      // update({ status: CONNECTING, err: '' })
      if (ethereum) {
        if (accounts === undefined)
          accounts = await ethereum.request({ method: "eth_requestAccounts" });

        if (accounts && accounts.length) {
          const chainId = await getChainId(); //wallet connected chainId
          // if (chainId === networks[G.chain].chainId) {

          update({
            status: CONNECTED,
            address: accounts[0],
            chainId: chainId,
            err: "",
          });
          //     return
          // } else {
          //     err = ERR_CHAINID.replace(':chainId', String(chainId))
          // }
        } else {
          err = ERR_NOACCOUNTS;
        }
      } else {
        err = ERR_INSTALL;
      }
    } catch (error: any) {
      err = "  " + error.message;
    }
    // update({ status: DISCONNECTED, address: '', err })
  };
  const getChainId = async () => {
    const { ethereum } = window;
    if (ethereum) {
      return Number(await ethereum.request({ method: "eth_chainId" }));
    }
    return 0;
  };

  const accountChanged = async (accounts: any) => {
    if (connected) {
      update({ address: "" });
    }
  };

  const chainChanged = async () => {
    if (connected) {
      _connect();
    }
    console.log("chainChanged");
  };

  const changeNetwork = async (chainId: number) => {
    if (window.ethereum) {
      try {
        let chainHexId = toHex(chainId);
        let res = await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: chainHexId }],
        });
        console.log(res.code);
        if (res.code === 4001) {
          return false;
        } else {
          return true;
        }
      } catch (error: any) {
        console.error("changeNetwork");
        console.error(error);
        if (error.code === 4001) {
          return false;
        } else {
          return true;
        }
      }
    }
  };

  const connect = async (): Promise<void> => {
    _connect();
  };

  const getCasinoInfoWithTokenId = async (tokenId: number): Promise<void> => {
    return await call(
      NFTContact.roulette.address,
      NFTContact.roulette.abi,
      "tokenIdToCasino",
      [tokenId]
    );
  };

  const getOwner = async (): Promise<void> => {
    try {
      // return await call(NFTContact.roulette.address, NFTContact.roulette.abi, 'owner') //fixed value parameter [2] is used for test
      if (window.ethereum) {
        const web3 = new window.Web3(G.rpc);
        const contract = new web3.eth.Contract(
          NFTContact.roulette.abi,
          NFTContact.roulette.address
        );
        // return await call(token, abiFlash, 'balanceOf', [G.address])
        return await contract.methods["owner"]().call();
      } else {
        console.log("No metamaks");
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const rouletteBetting = async (
    bets: any,
    totalBetAmount: any
  ): Promise<void> => {
    try {
      console.log("rouletteBetting : ");
      console.log(bets);
      if (window.ethereum) {
        let success: boolean = true;

        const rApproval = await approval(NFTContact.usdc.address);
        if (rApproval !== undefined) {
          const totalBetAmount_ = toEther(totalBetAmount.toString(), 18);
          const approval_ = toEther(rApproval, 18);
          console.log("approval : ");
          console.log(rApproval);
          console.log(totalBetAmount);

          if (approval_ < totalBetAmount_) {
            let tx = await approve(NFTContact.roulette.address, totalBetAmount);
            // let approve_value= await approval(NFTContact.usdc.address)
            // console.log('approve_value: ', approve_value);
            if (tx !== undefined) {
              success = await waitTransaction(tx);
            } else {
              success = false;
            }
          } else {
            console.log("lets go");
          }
        } else {
          success = false;
        }
        if (success) {
          // updateStatus({ loading: true, submitLabel: 'exchanging...' })
          const tx_ = await send(
            NFTContact.roulette.address,
            NFTContact.roulette.abi,
            "0x0",
            "placeBetsWithTokens",
            [G.tokenId, bets]
          ); //fixed value parameter [2] is used for test
          console.log("tx_ : >>>");
          console.log(tx_);
          if (tx_ !== undefined) {
            // updateStatus({ loading: true, submitLabel: 'confirming...' })
            // G.setPending(tx, { chain: G.chain, targetChain: G.targetChain, address: G.address, token: G.token, value: totalBetAmount, created: Math.round(new Date().getTime() / 1000) })
            const receipt = await waitTransaction(tx_);
            console.log(receipt);
            const Event = getEventSignature(
              NFTContact.roulette.address,
              NFTContact.roulette.abi,
              "RouletteSpinned"
            );

            const web3 = new window.Web3(G.rpc);
            let result;
            receipt.logs.forEach((log: any) => {
              if (log.topics[0] === Event.signature) {
                result = web3.eth.abi.decodeLog(
                  Event.inputs,
                  log.data,
                  log.topics.slice(1)
                );
              }
            });
            console.log(result);
            return result;
            // G.update({ value: '' })
          }
          // } else {
          //     console.log('the transaction failed');
          //     // G.update({ err: 'the transaction failed' })
          // }
        } else {
        }
      } else {
        console.log("No metamask");
      }
    } catch (error: any) {
      console.log(error);
    }
  };
  const maxReward = async (bets: any): Promise<void> => {
    // getMaximumReward
  };

  const ownerAddLiquidity = async (
    tokenId: number,
    amount: any
  ): Promise<boolean | any> => {
    // return await send(networks[G.chain].bridge, abiBridge, token === ZERO ? value : '0x0', 'deposit', [token, value, targetChain])
    let success = true;
    const rApproval = await approval(NFTContact.usdc.address);
    if (rApproval !== undefined) {
      const amount_ = toEther(amount.toString(), 18);
      const approval_ = toEther(rApproval, 18);
      console.log("approval : ");
      console.log(rApproval);
      console.log(amount);

      if (approval_ < amount_) {
        let tx = await approve(NFTContact.roulette.address, amount);
        // let approve_value= await approval(NFTContact.usdc.address)
        // console.log('approve_value: ', approve_value);
        if (tx !== undefined) {
          success = await waitTransaction(tx);
        } else {
          success = false;
        }
      } else {
        console.log("lets go");
      }
    } else {
      success = false;
    }
    if (success) {
      return await send(
        NFTContact.roulette.address,
        NFTContact.roulette.abi,
        "0x0",
        "addLiquidtyWithTokens",
        [tokenId, amount]
      );
    }
  };

  const ownerAddMaxbet = async (
    tokenId: number,
    amount: any
  ): Promise<boolean | any> => {
    return await send(
      NFTContact.roulette.address,
      NFTContact.roulette.abi,
      "0x0",
      "setMaxBet",
      [tokenId, amount]
    );
  };
  const getRoulettes = async (): Promise<string | undefined> => {
    try {
      return await call(
        NFTContact.casino.address,
        NFTContact.casino.abi,
        "_tokenIds",
        []
      );
    } catch (error: any) {
      console.log("getRoulettes : ");
      console.log(error);
    }
  };

  const getTokenURI = async (tokenId: number): Promise<string | undefined> => {
    try {
      return await call(
        NFTContact.casino.address,
        NFTContact.casino.abi,
        "tokenURI",
        [tokenId]
      );
    } catch (error: any) {
      console.log("getRoulettes : ");
      console.log(error);
    }
  };

  const getEventSignature = (
    address: string,
    abi: any,
    eventName: string
  ): any => {
    try {
      if (window.ethereum) {
        console.log(G.rpc);
        const { ethereum } = window;
        const web3 = new window.Web3(G.rpc);
        const contract = new web3.eth.Contract(abi, address);
        const event = contract._jsonInterface.find((o: any) => {
          return o.name === eventName && o.type === "event";
        });
        return event;
      } else {
        console.log("No metamask");
      }
    } catch (error: any) {
      console.log(error);
    }
  };

  const waitTransaction = async (txId: string): Promise<boolean | any> => {
    const web3 = new window.Web3(G.rpc);
    let repeat = 100;
    while (--repeat > 0) {
      const receipt = await web3.eth.getTransactionReceipt(txId);
      if (receipt) {
        const resolvedReceipt = await receipt;
        if (resolvedReceipt && resolvedReceipt.blockNumber) {
          return receipt;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
    return false;
  };

  const approval = async (token: string): Promise<string | undefined> => {
    return await call(
      NFTContact.usdc.address,
      NFTContact.usdc.abi,
      "allowance",
      [G.address, NFTContact.roulette.address]
    );
  };

  const approve = async (
    token: string,
    value: string
  ): Promise<string | undefined> => {
    return await send(
      NFTContact.usdc.address,
      NFTContact.usdc.abi,
      "0x0",
      "approve",
      [NFTContact.roulette.address, value]
    );
  };

  // const deposit = async (token: string, value: string, targetChain: number): Promise<string | undefined> => {
  //     // const tx = await G.deposit(token.address==='-' ? ZERO : token.address, value, networks[G.targetChain].chainId)
  //     return await send(networks[G.chain].bridge, abiBridge, token === ZERO ? value : '0x0', 'deposit', [token, value, targetChain])
  // }

  // return { ...G, update, check, addNetwork, changeNetwork, getPending, setPending, removePending, setTxs, connect, balance, bridgebalance, waitTransaction, approval, approve, /* depositToIcicb,  */deposit };
  return {
    connect,
    getCasinoInfoWithTokenId,
    waitTransaction,
    getOwner,
    rouletteBetting,
    approve,
    approval,
    monitoring,
    ownerAddLiquidity,
    ownerAddMaxbet,
    getRoulettes,
    getTokenURI,
  };
};

export default useWallet_;
