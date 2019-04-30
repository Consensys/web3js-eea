const axios = require("axios");
const RLP = require("rlp");
const { keccak256 } = require("./custom-ethjs-util");
const ethUtil = require("./custom-ethjs-util");

const PrivateTransaction = require("./privateTransaction");

function EEAClient(web3, chainId) {
  const GAS_PRICE = 0;
  const GAS_LIMIT = 3000000;

  // eslint-disable-next-line no-underscore-dangle
  const { host } = web3._currentProvider;

  if (host == null) {
    throw Error("Only supports http");
  }

  const getMakerTransaction = (txHash, retries, delay) => {
    /* eslint-disable promise/param-names */
    /* eslint-disable promise/avoid-new */

    const waitFor = ms => {
      return new Promise(r => {
        return setTimeout(r, ms);
      });
    };

    let notified = false;
    const retryOperation = (operation, times) => {
      return new Promise((resolve, reject) => {
        return operation()
          .then(result => {
            if (result == null) {
              if (!notified) {
                console.log("Waiting for transaction to be mined ...");
                notified = true;
              }
              throw Error("Waiting for tx to be mined");
            } else {
              return resolve();
            }
          })
          .catch(reason => {
            if (times - 1 > 0) {
              // eslint-disable-next-line promise/no-nesting
              return waitFor(delay)
                .then(retryOperation.bind(null, operation, times - 1))
                .then(resolve)
                .catch(reject);
            }
            return reject(reason);
          });
      });
    };

    const operation = () => {
      return web3.eth.getTransactionReceipt(txHash);
    };

    return retryOperation(operation, delay, retries);
  };

  const getTransactionCount = options => {
    const from = `0x${ethUtil.privateToAddress(options.from).toString("hex")}`;
    const participants = options.privateFor;
    participants.push(options.privateFrom);
    const map = participants.map(x => {
      return Buffer.from(x, "base64");
    });
    map.sort();

    const rlp = RLP.encode(map);

    const privacyGroupIdHash = keccak256(rlp).toString("hex");

    const privacyGroup = `0x${Buffer.from(
      Buffer.from(privacyGroupIdHash, "hex").toString("base64")
    ).toString("hex")}`;

    const payload = {
      jsonrpc: "2.0",
      method: "eea_getTransactionCount",
      params: [from, privacyGroup],
      id: 1
    };

    return axios.post(host, payload).then(result => {
      return parseInt(result.data.result, 16);
    });
  };

  // eslint-disable-next-line no-param-reassign
  web3.eea = {
    getTransactionCount,
    sendRawTransaction: options => {
      const tx = new PrivateTransaction();
      const privateKeyBuffer = Buffer.from(options.privateKey, "hex");

      return web3.eea
        .getTransactionCount({
          from: privateKeyBuffer,
          privateFrom: options.privateFrom,
          privateFor: options.privateFor
        })
        .then(transactionCount => {
          tx.nonce = options.nonce || transactionCount;
          tx.gasPrice = GAS_PRICE;
          tx.gasLimit = GAS_LIMIT;
          tx.to = options.to;
          tx.value = 0;
          tx.data = options.data;
          // eslint-disable-next-line no-underscore-dangle
          tx._chainId = chainId;
          tx.privateFrom = options.privateFrom;
          tx.privateFor = options.privateFor;
          tx.restriction = "restricted";
          tx.sign(privateKeyBuffer);

          const signedRlpEncoded = tx.serialize().toString("hex");

          return axios.post(host, {
            jsonrpc: "2.0",
            method: "eea_sendRawTransaction",
            params: [signedRlpEncoded],
            id: 1
          });
        })
        .then(result => {
          return result.data.result;
        });
    },
    getTransactionReceipt: (
      txHash,
      enclavePublicKey,
      retries = 300,
      delay = 1000
    ) => {
      return getMakerTransaction(txHash, retries, delay)
        .then(() => {
          return axios.post(host, {
            jsonrpc: "2.0",
            method: "eea_getTransactionReceipt",
            params: [txHash, enclavePublicKey],
            id: 1
          });
        })
        .then(result => {
          return result.data.result;
        });
    }
  };

  return web3;
}

module.exports = EEAClient;
