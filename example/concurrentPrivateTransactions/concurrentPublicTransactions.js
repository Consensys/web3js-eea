const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const PromisePool = require("async-promise-pool");
const EEAClient = require("../../src");
const { besu } = require("../keys.js");

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);

/*
  Transactions are sent in batches.
  TX_COUNT defines the total of transactions
  BATCH_SIZE defines how many transactions will be sent at once
*/
const TX_COUNT = 1000;
const BATCH_SIZE = 120;
// can set this address to any contract address eg deployed ERC20 contract
const CONTRACT_ADDRESS = "0x000000000000000000000000000000000000007e"; // privacy precompile address

// get public nonce of account
function getPublicNonce(account) {
  return web3.eth.getTransactionCount(account, "pending");
}

// create and sign PMT
function sendPMT(sender, enclaveKey, nonce) {
  const rawTx = {
    nonce: web3.utils.numberToHex(nonce), // PMT nonce
    from: sender,
    to: CONTRACT_ADDRESS,
    data: enclaveKey,
    gasLimit: "0x5a88"
  };

  const tx = new Tx(rawTx);
  tx.sign(Buffer.from(besu.node1.privateKey, "hex"));

  const hexTx = `0x${tx.serialize().toString("hex")}`;

  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    web3.eth
      .sendSignedTransaction(hexTx)
      .once("receipt", rcpt => {
        resolve(rcpt);
      })
      .on("error", error => {
        reject(error);
      });
  });
}

/*
  Example of sending transactions in batch.
  
  The basic steps are:
  
  1. Find the expected public nonce for the sender account
  2. Create a TX for each public transaction (incrementing the public nonce)
*/
module.exports = async () => {
  const sender = "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73";

  const publicNonce = await getPublicNonce(sender);

  const pool = new PromisePool({ concurrency: BATCH_SIZE });

  for (let i = 0; i < TX_COUNT; i += 1) {
    pool.add(() => {
      console.log(`publicNonce ${publicNonce} + ${i}`);
      return sendPMT(sender, "dummy-data", publicNonce + i);
    });
  }

  await pool.all();
};

if (require.main === module) {
  module.exports();
}
