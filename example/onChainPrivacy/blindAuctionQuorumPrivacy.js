const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const Web3 = require("web3");
const Tx = require("ethereumjs-tx");
const EEAClient = require("../../src");

const { orion, besu } = require("../keys.js");

const binary = fs.readFileSync(
  path.join(__dirname, "../solidity/Greeter/greeter.bin")
);

const greeterAbi = require("../solidity/Greeter/greeter_meta").output.abi;

const web3Node1 = new EEAClient(new Web3(besu.node1.url), 2018);
const web3Node2 = new EEAClient(new Web3(besu.node2.url), 2018);
const web3Node3 = new EEAClient(new Web3(besu.node3.url), 2018);

const createGreeterContract = privacyGroupId => {
  const contractOptions = {
    data: `0x${binary}`,
    privateFrom: orion.node1.publicKey,
    privacyGroupId,
    privateKey: besu.node1.privateKey
  };
  return web3Node1.eea.sendRawTransaction(contractOptions);
};

const getPrivateContractAddress = transactionHash => {
  return web3Node1.priv
    .getTransactionReceipt(transactionHash, orion.node1.publicKey)
    .then(privateTransactionReceipt => {
      return privateTransactionReceipt.contractAddress;
    });
};

const callGenericFunction = (
  web3,
  privateFrom,
  privateKey,
  address,
  privacyGroupId,
  method,
  value
) => {
  const contract = new web3.eth.Contract(greeterAbi);

  // eslint-disable-next-line no-underscore-dangle
  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === method;
  });

  const functionArgs =
    value !== null
      ? web3.eth.abi.encodeParameters(functionAbi.inputs, [value]).slice(2)
      : null;

  const functionCall = {
    to: address,
    data:
      functionArgs !== null
        ? functionAbi.signature + functionArgs
        : functionAbi.signature,
    privateFrom,
    privateKey,
    privacyGroupId
  };
  return web3.eea
    .sendRawTransaction(functionCall)
    .then(privateTxHash => {
      console.log("Transaction Hash:", privateTxHash);
      return web3.priv.getTransactionReceipt(privateTxHash, privateFrom);
    })
    .then(result => {
      return result;
    });
};

const distributeRawSetGreeting = (privacyGroupId, greeterAddress, value) => {
  const contract = new web3Node3.eth.Contract(greeterAbi);

  // eslint-disable-next-line no-underscore-dangle
  const functionAbi = contract._jsonInterface.find(e => {
    return e.name === "setGreeting";
  });

  const functionCall = {
    to: greeterAddress,
    data:
      functionAbi.signature +
      web3Node3.eth.abi.encodeParameters(functionAbi.inputs, [value]).slice(2),
    privateFrom: orion.node3.publicKey,
    privateKey: besu.node3.privateKey,
    privateFor: [orion.node1.publicKey, orion.node2.publicKey]
  };

  return web3Node3.priv.distributeRawTransaction(functionCall);
};

const sendPrivacyMarkerTransaction = enclaveKey => {
  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve, reject) => {
    const besuAccount = web3Node3.eth.accounts.privateKeyToAccount(
      `0x${besu.node3.privateKey}`
    );
    web3Node3.eth
      .getTransactionCount(besuAccount.address, "pending")
      .then(count => {
        const rawTx = {
          nonce: web3Node3.utils.numberToHex(count),
          from: besuAccount.address,
          to: "0x000000000000000000000000000000000000007d",
          value: 0,
          data: enclaveKey,
          gasPrice: "0xFFFFF",
          gasLimit: "0xFFFFF"
        };
        const tx = new Tx(rawTx);
        tx.sign(Buffer.from(besu.node3.privateKey, "hex"));
        const serializedTx = tx.serialize();
        console.log(tx.getHash());
        return web3Node3.eth
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

module.exports = async () => {
  const privacyGroupId = crypto.randomBytes(32).toString("base64");

  console.log(privacyGroupId);

  const creationResult = await web3Node1.privx.createPrivacyGroup({
    participants: [
      orion.node1.publicKey,
      orion.node2.publicKey,
      orion.node3.publicKey
    ],
    enclaveKey: orion.node1.publicKey,
    privateFrom: orion.node1.publicKey,
    privateKey: besu.node1.privateKey,
    privacyGroupId
  });

  const greeterContractAddress = await createGreeterContract(
    creationResult.privacyGroupId
  ).then(res => {
    return getPrivateContractAddress(res);
  });

  const greeterSetResultFirstNode = await callGenericFunction(
    web3Node1,
    orion.node2.publicKey,
    besu.node2.privateKey,
    greeterContractAddress,
    creationResult.privacyGroupId,
    "setGreeting",
    "test"
  ).then(r => {
    return r;
  });

  console.log(greeterSetResultFirstNode);

  const greeterSetResultSecondNode = await callGenericFunction(
    web3Node2,
    orion.node2.publicKey,
    besu.node2.privateKey,
    greeterContractAddress,
    creationResult.privacyGroupId,
    "setGreeting",
    "secondTest"
  ).then(r => {
    return r;
  });

  console.log(greeterSetResultSecondNode);

  const enclaveKey = await distributeRawSetGreeting(
    creationResult.privacyGroupId,
    greeterContractAddress,
    "new greeting"
  );

  const privacyMarkerTransactionResult = await sendPrivacyMarkerTransaction(
    enclaveKey
  );

  console.log(privacyMarkerTransactionResult);

  const greeterGet = await callGenericFunction(
    web3Node1,
    orion.node1.publicKey,
    besu.node1.privateKey,
    greeterContractAddress,
    creationResult.privacyGroupId,
    "greet",
    null
  ).then(r => {
    return r;
  });

  console.log(greeterGet);
};

if (require.main === module) {
  module.exports();
}
