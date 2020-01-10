const fs = require("fs");
const path = require("path");
const Tx = require("ethereumjs-tx");

const Web3 = require("web3");
const EEAClient = require("../../src");

const createGroup = require("../privacyGroupManagement/createPrivacyGroup");

const { orion, besu } = require("../keys.js");

const binary = fs.readFileSync(
  path.join(__dirname, "../solidity/EventEmitter/EventEmitter.bin")
);

const web3 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);

const createGroupId = () => {
  return createGroup.createPrivacyGroup();
};

const distributeRawContractCreation = privacyGroupId => {
  const contractOptions = {
    data: `0x${binary}`,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  };
  return web3.priv.distributeRawTransaction(contractOptions);
};

const sendPrivacyMarkerTransaction = enclaveKey => {
  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    const besuAccount = web3.eth.accounts.privateKeyToAccount(
      `0x${besu.node1.privateKey}`
    );
    web3.eth
      .getTransactionCount(besuAccount.address, "pending")
      .then(count => {
        const rawTx = {
          nonce: web3.utils.numberToHex(count),
          from: besuAccount.address,
          to: "0x000000000000000000000000000000000000007e",
          value: 0,
          data: enclaveKey,
          gasPrice: "0xFFFFF",
          gasLimit: "0xFFFFF"
        };
        const tx = new Tx(rawTx);
        tx.sign(Buffer.from(besu.node1.privateKey, "hex"));
        const serializedTx = tx.serialize();
        return web3.eth
          .sendSignedTransaction(`0x${serializedTx.toString("hex")}`)
          .on("receipt", r => {
            resolve(r);
          });
      })
      .catch(e => {
        reject(e);
      });
  });
};

const getTransactionReceipts = txHash => {
  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    web3Node2.eth
      .getTransactionReceipt(txHash)
      .then(resolve)
      .catch(reject);
  });
};

const fetchFromOrion = txHash => {
  web3.priv
    .getTransactionReceipt(txHash, orion.node1.publicKey)
    .then(result => {
      console.log("Got transaction receipt from orion node 1");
      return console.log(result);
    })
    .catch(console.error);
  web3Node2.priv
    .getTransactionReceipt(txHash, orion.node2.publicKey)
    .then(result => {
      console.log("Got transaction receipt from orion node 2");
      return console.log(result);
    })
    .catch(console.error);
};

module.exports = async () => {
  const privacyGroupId = await createGroupId();
  const enclaveKey = await distributeRawContractCreation(privacyGroupId);
  console.log(`Enclave key: ${enclaveKey}`);
  const privacyMarkerTransactionResult = await sendPrivacyMarkerTransaction(
    enclaveKey
  );
  await getTransactionReceipts(
    privacyMarkerTransactionResult.transactionHash
  ).then(console.log);

  setTimeout(() => {
    fetchFromOrion(privacyMarkerTransactionResult.transactionHash);
  }, 1000);
};

if (require.main === module) {
  module.exports();
}
