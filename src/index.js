const axios = require("axios");
const RLP = require("rlp");
const _ = require("lodash");
const { keccak256, privateToAddress } = require("./custom-ethjs-util");

const PrivateTransaction = require("./privateTransaction");

function EEAClient(web3, chainId) {
  const GAS_PRICE = 0;
  const GAS_LIMIT = 3000000;

  const { host } = web3.eth.currentProvider;

  if (host == null) {
    throw Error("Only supports http");
  }

  /**
   * Returns the Private Marker transaction
   * @param {string} txHash The transaction hash
   * @param {int} retries Number of retries to be made to get the private marker transaction receipt
   * @param {int} delay The delay between the retries
   * @returns Promise to resolve the private marker transaction receipt
   */
  const getMarkerTransaction = (txHash, retries, delay) => {
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
              if (delay === 0) {
                throw new Error(
                  `Timed out after ${retries} attempts waiting for transaction to be mined`
                );
              } else {
                const waitInSeconds = (retries * delay) / 1000;
                throw new Error(
                  `Timed out after ${waitInSeconds}s waiting for transaction to be mined`
                );
              }
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

    return retryOperation(operation, retries);
  };

  /**
   * Generate a privacyGroupId
   * @param options Options passed into `eea_sendRawTransaction`
   * @returns String
   */
  const generatePrivacyGroup = options => {
    const participants = _.chain(options.privateFor || [])
      .concat(options.privateFrom)
      .uniq()
      .map(publicKey => {
        const buffer = Buffer.from(publicKey, "base64");
        let result = 1;
        buffer.forEach(value => {
          // eslint-disable-next-line no-bitwise
          result = (31 * result + ((value << 24) >> 24)) & 0xffffffff;
        });
        return { b64: publicKey, buf: buffer, hash: result };
      })
      .sort((a, b) => {
        return a.hash - b.hash;
      })
      .map(x => {
        return x.buf;
      })
      .value();

    const rlp = RLP.encode(participants);

    return Buffer.from(keccak256(rlp)).toString("base64");
  };

  /**
   * Get the transaction count
   * @param options Options passed into `eea_sendRawTransaction`
   * @returns {Promise<transaction count | never>}
   */
  const getTransactionCount = options => {
    let privacyGroupId;
    if (options.privacyGroupId) {
      ({ privacyGroupId } = options);
    } else {
      privacyGroupId = generatePrivacyGroup(options);
    }

    const payload = {
      jsonrpc: "2.0",
      method: "priv_getTransactionCount",
      params: [options.from, privacyGroupId],
      id: 1
    };

    return axios.post(host, payload).then(result => {
      return parseInt(result.data.result, 16);
    });
  };

  /**
   * Create a privacy group
   * @param options Options passed into `eea_sendRawTransaction`
   * @returns {Promise<transaction count | never>}
   */
  const createPrivacyGroup = options => {
    const payload = {
      jsonrpc: "2.0",
      method: "priv_createPrivacyGroup",
      params: [
        {
          addresses: options.addresses,
          name: options.name,
          description: options.description
        }
      ],
      id: 1
    };

    return axios
      .post(host, payload)
      .then(result => {
        return result.data.result;
      })
      .catch(error => {
        if (error.response) {
          throw JSON.stringify(error.response.data);
        } else {
          throw error;
        }
      });
  };

  /**
   * Delete a privacy group
   * @param options Options passed into `eea_sendRawTransaction`
   * @returns {Promise<transaction count | never>}
   */
  const deletePrivacyGroup = options => {
    const payload = {
      jsonrpc: "2.0",
      method: "priv_deletePrivacyGroup",
      params: [options.privacyGroupId],
      id: 1
    };

    return axios.post(host, payload).then(result => {
      return result.data.result;
    });
  };

  /**
   * Find privacy groups
   * @param options Options passed into `eea_sendRawTransaction`
   * @returns {Promise<transaction count | never>}
   */
  const findPrivacyGroup = options => {
    const payload = {
      jsonrpc: "2.0",
      method: "priv_findPrivacyGroup",
      params: [options.addresses],
      id: 1
    };

    return axios.post(host, payload).then(result => {
      return result.data.result;
    });
  };

  /**
   * Get the private transaction Receipt.
   * @param {string} txHash Transaction Hash of the marker transaction
   * @param {string} enclavePublicKey Public key used to start-up the Enclave
   * @param {int} retries Number of retries to be made to get the private marker transaction receipt
   * @param {int} delay The delay between the retries
   * @returns {Promise<AxiosResponse<any> | never>}
   */
  const getTransactionReceipt = (
    txHash,
    enclavePublicKey,
    retries = 300,
    delay = 1000
  ) => {
    return getMarkerTransaction(txHash, retries, delay)
      .then(() => {
        return axios.post(host, {
          jsonrpc: "2.0",
          method: "priv_getTransactionReceipt",
          params: [txHash, enclavePublicKey],
          id: 1
        });
      })
      .then(result => {
        return result.data.result;
      });
  };

  // eslint-disable-next-line no-param-reassign
  web3.priv = {
    generatePrivacyGroup,
    createPrivacyGroup,
    deletePrivacyGroup,
    findPrivacyGroup,
    getTransactionCount,
    getTransactionReceipt
  };

  // eslint-disable-next-line no-param-reassign
  web3.eea = {
    /**
     * Send the Raw transaction to the Pantheon node
     * @param options Map to send a raw transction to pantheon
     * options map can contain the following:
     * privateKey : Private Key used to sign transaction with
     * privateFrom : Enclave public key
     * privateFor : Enclave keys to send the transaction to
     * privacyGroupId : Enclave id representing the receivers of the transaction
     * nonce(Optional) : If not provided, will be calculated using `eea_getTransctionCount`
     * to : The address to send the transaction
     * data : Data to be sent in the transaction
     *
     * @returns {Promise<AxiosResponse<any> | never>}
     */
    sendRawTransaction: options => {
      if (options.privacyGroupId && options.privateFor) {
        throw Error("privacyGroupId and privateFor are mutually exclusive");
      }
      const tx = new PrivateTransaction();
      const privateKeyBuffer = Buffer.from(options.privateKey, "hex");
      const from = `0x${privateToAddress(privateKeyBuffer).toString("hex")}`;
      return web3.priv
        .getTransactionCount({
          from,
          privateFrom: options.privateFrom,
          privateFor: options.privateFor,
          privacyGroupId: options.privacyGroupId
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

          if (options.privateFor) {
            tx.privateFor = options.privateFor;
          }
          if (options.privacyGroupId) {
            tx.privacyGroupId = options.privacyGroupId;
          }
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
        })
        .catch(error => {
          if (error.response) {
            throw JSON.stringify(error.response.data);
          } else {
            throw error;
          }
        });
    }
  };

  return web3;
}

module.exports = EEAClient;
