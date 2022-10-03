declare interface Window {
    connector: IConnector;
    ethereum: any;
    Web3: any;
}
declare interface ServerResponse {
    result?: any
    error?: number
}

declare interface WalletTypes {
    walletModal: boolean
    rpc: string
    walletSelect: string
    status: string
    address: string
    checking: boolean
    balance: any
    tokenSymbol: string
    tokenUSD: number
    nonce: any
    tokenId: number
    _tokenIds: number
    err: string
}

declare interface NetworkTypes {
    bridge: string
    chainId: number
    coin: string
    decimals: number
    confirmations: number
    blocktime: number
    rpc: string
    explorer: string
    erc20: string
    disabled?: boolean
}

declare interface PendingType {
    chain: string
    targetChain: string
    address: string
    token: string
    value: number
    created: number
}

declare interface TxType {
    tx: string
    err: boolean
    fee: string
    confirmations: number
}

declare interface PendingTypes {
    [txid: string]: PendingType
}

declare interface TxTypes {
    [txid: string]: TxType
}

declare interface CoinTypes {
    [symbol: string]: {
        [chain: string]: {
            address: string
            decimals: number
        }
    }
}

declare interface GlobalTypes extends WalletTypes {
    loading: boolean
    inited: boolean
    pending: PendingTypes
    txs: TxTypes
    chain: string
}
declare interface ResultType {
    err: string,
    result: string
}
declare interface UseWalletTypes extends GlobalTypes {
    update(payload: { [key: string]: string | number | boolean | PendingTypes | TxTypes | CoinTypes })
    addNetwork();
    check(network: string, txs: Array<string>): Promise<{ [txId: string]: number }>
    getPending(): { pending: PendingTypes, txs: TxTypes }
    setPending(key: string, pending: PendingType)
    removePending(txId: string)
    setTxs(txs: TxTypes)
    balance(token: string, rpc?: string): Promise<string | undefined>
    bridgebalance(chain: string, token: string): Promise<string | undefined>
    changeNetwork(chainId: number)
    connect(): Promise<void>

    waitTransaction(txId: string): Promise<boolean>

    approval(token: string): Promise<string | undefined>
    approve(token: string, amount: string): Promise<string | undefined>

    /* depositToIcicb(token:string, amount:string, targetChain:string, targetToken:string): Promise<string|null> */
    deposit(token: string, amount: string, targetChain: number): Promise<string | undefined>

}

declare type CallbackAccountsChanged = (address: string) => void
declare type CallbackChainChanged = (chainid: number) => void
