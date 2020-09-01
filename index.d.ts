// Based on:
// - https://github.com/PegaSysEng/web3js-eea/blob/master/src/index.js
// - https://besu.hyperledger.org/en/latest/Reference/API-Methods/
// - https://besu.hyperledger.org/en/latest/Reference/API-Objects/
// - https://entethalliance.github.io/client-spec/spec.html#sec-privacy-groups
// - https://github.com/hyperledger/besu/blob/master/ethereum/api/src/test/java/org/hyperledger/besu/ethereum/api/jsonrpc/internal/privacy/methods/privx/PrivxFindOnChainPrivacyGroupTest.java

import Web3 from "web3";
import { EventEmitter } from "events";

type SendRawOptionsBase = {
  privateKey: string;
  privateFrom: string;
  from?: string;
  to?: string;
  data?: string;
  nonce?: number;
};

// privateFor and privacyGroupId are mutually exclusive
export type SendRawOptions =
  | (SendRawOptionsBase & { privacyGroupId?: never; privateFor: string | string[] })
  | (SendRawOptionsBase & { privacyGroupId: string; privateFor?: never });

export type Log = {
  removed: boolean;
  logIndex: string;
  transactionIndex: string;
  transactionHash: string;
  blockHash: string;
  blockNumber: string;
  address: string;
  data: string;
  topics: string[];
};

export type PrivateLog = {
  subscription: string;
  privacyGroupId: string;
  result: Log;
};

export type PrivateTransactionReceipt = {
  contractAddress: string | null;
  from: string;
  output: string | null;
  commitmentHash: string;
  transactionHash: string;
  privateFrom: string;
  privateFor?: string[];
  privacyGroupId?: string;
  status: string;
  logs: Log[];
  logsBloom: string;
  blockHash: string;
  blockNumber: string;
  transactionIndex: string;
};

export type PrivacyGroup = {
  name: string;
  privacyGroupId: string;
  members: string[];
  description: string;
};

export type Filter = {
  fromBlock?: string;
  toBlock?: string;
  address?: string;
  topics?: string[];
};

export type PrivateTransaction = {
  from: string;
  gas: string;
  gasPrice: string;
  hash: string;
  input: string;
  nonce: string;
  to: string;
  value: string;
  v: string;
  r: string;
  s: string;
  privateFrom: string;
  privateFor?: string[];
  privacyGroupId?: string;
  restriction: string;
};

export default class EEAClient extends Web3 {
  constructor(web3: Web3, chainId?: number);
  eea: {
    sendRawTransaction: (options: SendRawOptions) => Promise<string>;
  };
  priv: {
    generatePrivacyGroup: (options: { privateFrom: string; privateFor?: string | string[] }) => string;
    deletePrivacyGroup: (options: { privacyGroupId: string }) => Promise<string>;
    findPrivacyGroup: (options: { addresses: string[] }) => Promise<PrivacyGroup[]>;
    distributeRawTransaction: (options: SendRawOptions) => Promise<string>;
    getTransactionCount: (options: { from: string; privacyGroupId?: string }) => Promise<number>;
    getTransactionReceipt: (
      txHash: string,
      enclavePublicKey?: string,
      retries?: number,
      delay?: number
    ) => Promise<PrivateTransactionReceipt | null>;
    call: (options: { privacyGroupId: string; to: string; data: string; blockNumber?: number }) => Promise<PrivateTransactionReceipt>;
    subscribe: (
      privacyGroupId: string,
      filter: Filter,
      callback: (error: Error | null, result?: string) => void
    ) => Promise<PrivateSubscription>;
    createPrivacyGroup: (options: { addresses: string[]; name?: string; description?: string }) => Promise<string>;
    getTransaction: (txHash: string) => Promise<PrivateTransaction | null>;
    getPastLogs: (privacyGroupId: string, filter: Filter) => Promise<Log[]>;
    createFilter: (privacyGroupId: string, filter: Filter) => Promise<string>;
    getFilterLogs: (privacyGroupId: string, filterId: string) => Promise<Log[]>;
    getFilterChanges: (privacyGroupId: string, filterId: string) => Promise<Log[]>;
    uninstallFilter: (privacyGroupId: string, filterId: string) => Promise<boolean>;
  };
  privx: {
    createPrivacyGroup: (
      options: {
        privacyGroupId?: string;
        privateKey: string;
        enclaveKey: string;
        participants: string[];
      }
    ) => Promise<PrivateTransactionReceipt>;
    findOnChainPrivacyGroup: (options: { addresses: string[] }) => Promise<PrivacyGroup>;
    removeFromPrivacyGroup: (
      options: {
        privacyGroupId: string;
        privateKey: string;
        enclaveKey: string;
        participant: string;
      }
    ) => Promise<PrivateTransactionReceipt>;
    addToPrivacyGroup: (
      options: {
        privacyGroupId: string;
        privateKey: string;
        enclaveKey: string;
        participants: string[];
      }
    ) => Promise<PrivateTransactionReceipt>;
    setPrivacyGroupLockState: (
      options: {
        privacyGroupId: string;
        privateKey: string;
        enclaveKey: string;
        lock: boolean;
      }
    ) => Promise<PrivateTransactionReceipt>;
  };
}

// fixme: this class hasn't been typed exhaustively
declare class PrivateSubscription extends EventEmitter {
  constructor(web3: Web3, privacyGroupId: string, filter: Filter);
  subscribe(): Promise<string>;
  on(eventName: string, callback: (error: Error | null, result?: PrivateLog) => void): this;
  on(eventName: "data", callback: (data: PrivateLog) => void): this;
  on(eventName: "error", callback: (error: Error) => void): this;
  reset(): void;
  unsubscribe(callback: () => void): Promise<string>;
}
