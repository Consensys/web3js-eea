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

const generatePrivateMarkerTransaction = enclaveKey => {
  // const markerTransactionDetails = {
  //   privateFrom: orion.node1.publicKey,
  //
  // }

  const pantheonAccount = web3.eth.accounts.privateKeyToAccount(
    pantheon.node1.privateKey
  );
  const rawTx = {
    from: pantheonAccount.address,
    to: "0x000000000000000000000000000000000000007e",
    value: 0,
    data: enclaveKey,
    nonce: "0x00",
    gasPrice: "0x09184e72a000",
    gasLimit: "0xFFFF"
  };

  const tx = new Tx(rawTx);
  tx.sign(new Buffer(pantheon.node1.privateKey, "hex"));

  const serializedTx = tx.serialize();
  web3.eth
    .sendSignedTransaction(`0x${serializedTx.toString("hex")}`)
    .on("receipt", console.log);
};

module.exports = async () => {
  const privacyGroupId = await createGroupId();
  const enclaveKey = await distributeRawContractCreation(privacyGroupId);
  const privacyMarkerTransactionHash = await generatePrivateMarkerTransaction(
    enclaveKey
  );
  console.log(privacyMarkerTransactionHash);
};

if (require.main === module) {
  module.exports();
}
