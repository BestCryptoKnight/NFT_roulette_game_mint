import { createSlice } from "@reduxjs/toolkit";
// import networks from './config/networks.json'
import { RPCS, supportChainId } from "./config/global.const";

const initial: WalletTypes = {
  walletModal: false,
  rpc: RPCS[supportChainId],
  walletSelect: "",
  status: "disconnected",
  address: "",
  checking: false,
  balance: 0,
  tokenSymbol: "",
  tokenUSD: 0,
  nonce: "",
  tokenId: 0,
  _tokenIds: 0,
  err: "",
};

// const coins: CoinTypes = {}
// for (let k in networks) {
//     coins[networks[k].coin] = { [k]: { address: '-', decimals: networks[k].decimals } }
// }

const initialState: GlobalTypes = {
  loading: false,
  inited: false,
  pending: {},
  txs: {},
  ...initial,
  chain: "ETH",
};
//I should automatically create a flashcoins object.
//Current flashcoins is created statically

export default createSlice({
  name: "roulette",
  initialState,
  reducers: {
    update: (state: any, action) => {
      for (const k in action.payload) {
        if (state[k] === undefined) new Error("  undefined account item");
        state[k] = action.payload[k];
      }
    },
  },
});
