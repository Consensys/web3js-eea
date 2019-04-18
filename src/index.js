const PrivateTransaction = require("./privateTransaction");
const Buffer = require("safe-buffer").Buffer;
const ethUtil = require("./custom-ethjs-util");
const axios = require("axios");

function EEAClient(web3, chainId) {
  const GAS_PRICE = 1000;
  const GAS_LIMIT = 3000000;

  const host = web3._currentProvider.host;

  if (host == null) {
    throw Error("Only supports http");
  }

  const getMakerTransaction = (txHash, delay, retries) => {
    const waitFor = ms => new Promise(r => setTimeout(r, ms));

    var notified = false;
    const retryOperation = (operation, delay, times) =>
      new Promise((resolve, reject) => {
        return operation()
          .then(result => {
            if (result == null) {
              if (!notified) {
                console.log("Waiting for transaction to be mined ...");
                notified = true;
              }
              throw Error("Waiting for tx to be mined");
            } else {
              resolve();
            }
          })
          .catch(reason => {
            if (times - 1 > 0) {
              return waitFor(delay)
                .then(retryOperation.bind(null, operation, delay, times - 1))
                .then(resolve)
                .catch(reject);
            }
            return reject(reason);
          });
      });

    const operation = () => web3.eth.getTransactionReceipt(txHash);

    return retryOperation(operation, delay, retries);
  };

  web3.eea = {
    sendRawTransaction: options => {
      const tx = new PrivateTransaction();
      const privateKeyBuffer = new Buffer(options.privateKey, "hex");

      return web3.eth
        .getTransactionCount(
          ethUtil.privateToAddress(privateKeyBuffer).toString("hex")
        )
        .then(nonce => {
          tx.nonce = nonce;
          tx.gasPrice = GAS_PRICE;
          tx.gasLimit = GAS_LIMIT;
          tx.to = options.to;
          tx.value = 0;
          tx.data = options.data;
          tx._chainId = chainId;
          tx.privateFrom = options.privateFrom;
          tx.privateFor = options.privateFor;
          tx.restriction = "restricted";
          tx.sign(privateKeyBuffer);

          const signedRlpEncoded = tx.serialize().toString("hex");

          return axios
            .post(host, {
              jsonrpc: "2.0",
              method: "eea_sendRawTransaction",
              params: [signedRlpEncoded],
              id: 1
            })
            .then(result => {
              return result.data.result;
            });
        });
    },
    getTransactionReceipt: (
      txHash,
      enclavePublicKey,
      delay = 100,
      retries = 30
    ) => {
      return getMakerTransaction(txHash, retries, delay).then(() => {
        return axios
          .post(host, {
            jsonrpc: "2.0",
            method: "eea_getTransactionReceipt",
            params: [txHash, enclavePublicKey],
            id: 1
          })
          .then(result => {
            return result.data.result;
          });
      });
    }
  };

  return web3;
}

module.exports = EEAClient;
