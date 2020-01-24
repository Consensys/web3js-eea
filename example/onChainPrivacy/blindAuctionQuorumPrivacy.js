/*
 * Code potentially relevant to creation of a blind auction using Quorum-style privacy
 * */
/*
// eslint-disable-next-line no-unused-vars
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

// eslint-disable-next-line no-unused-vars
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
        console.log(tx.hash());
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
*/
