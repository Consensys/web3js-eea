const fs = require("fs");
const path = require("path");
const Tx = require("ethereumjs-tx");

const Web3 = require("web3");
const EEAClient = require("../../src");

const createGroup = require("../privacyGroupManagement/createPrivacyGroup");

const { orion, pantheon } = require("../keys.js");

const binary = fs.readFileSync(
  path.join(__dirname, "../solidity/EventEmitter/EventEmitter.bin")
);

const web3 = new EEAClient(new Web3(pantheon.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(pantheon.node2.url), 2018);

const createGroupId = () => {
  return createGroup.createPrivacyGroup();
};

const distributeRawContractCreation = privacyGroupId => {
  const contractOptions = {
    data: `0x${binary}`,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: pantheon.node1.privateKey
  };
  return web3.priv.distributeRawTransaction(contractOptions);
};

const sendPrivacyMarkerTransaction = enclaveKey => {
  return new Promise((resolve, reject) => {
    const pantheonAccount = web3.eth.accounts.privateKeyToAccount(
      `0x${pantheon.node1.privateKey}`
    );
    web3.eth
      .getTransactionCount(pantheonAccount.address, "pending")
      .then(count => {
        const rawTx = {
          nonce: web3.utils.numberToHex(count),
          from: pantheonAccount.address,
          to: "0x000000000000000000000000000000000000007e",
          value: 0,
          data: enclaveKey,
          gasPrice: "0xFFFF",
          gasLimit: "0xFFFF"
        };
        const tx = new Tx(rawTx);
        tx.sign(Buffer.from(pantheon.node1.privateKey, "hex"));
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
  return new Promise((resolve, reject) => {
    web3Node2.eth
      .getTransactionReceipt(txHash)
      .then(resolve)
      .catch(reject);
  });
};

const fetchFromOrion = txHash => {
  console.log(txHash);
  console.log("here");
  web3.eea
    .getTransactionReceipt(txHash)
    .then(console.log)
    .catch(console.error);
  web3Node2.eea
    .getTransactionReceipt(txHash)
    .then(console.log)
    .catch(console.error);
};

module.exports = async () => {
  const privacyGroupId = await createGroupId();
  const enclaveKey = await distributeRawContractCreation(privacyGroupId);
  const privacyMarkerTransactionResult = await sendPrivacyMarkerTransaction(
    enclaveKey
  );
  await getTransactionReceipts(privacyMarkerTransactionResult.transactionHash).then(console.log);

  setTimeout(() => {
    fetchFromOrion(privacyMarkerTransactionResult.transactionHash);
  }, 10000);
};

if (require.main === module) {
  module.exports();
}
