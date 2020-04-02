const axios = require("axios");
const RLP = require("rlp");
const _ = require("lodash");
const { keccak256, privateToAddress } = require("./custom-ethjs-util");
const privacyProxyAbi = require("./solidity/PrivacyProxy.json").output.abi;
const PrivateTransaction = require("./privateTransaction");

function EEAClient(web3, chainId) {
  const GAS_PRICE = 0;
  const GAS_LIMIT = 3000000;

  const { host } = web3.eth.currentProvider;

  if (host == null) {
    throw Error("Only supports http");
  }

  const genericSendRawTransaction = (options, method) => {
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
          method,
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
  };

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
   * @param options Options passed into `findPrivacyGroup`
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

  const distributeRawTransaction = options => {
    return genericSendRawTransaction(options, "priv_distributeRawTransaction");
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

  /**
   * Invokes a private contract function locally
   * @param options Options passed into `priv_call`
   * options map can contain the following:
   * privacyGroupId : Enclave id representing the receivers of the transactio
   * to : Contract address,
   * data : Encoded function call (signature + data)
   * blockNumber: Blocknumber  efaults to "latest"
   * @returns {Promise<AxiosResponse<T>>}
   */
  const call = options => {
    const txCall = {};
    txCall.to = options.to;
    txCall.data = options.data;

    const payload = {
      jsonrpc: "2.0",
      method: "priv_call",
      params: [options.privacyGroupId, txCall, options.blockNumber || "latest"],
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
   * Get the private transaction.
   * @param {string} transactionHash Transaction Hash of the marker transaction
   * @returns {Promise<AxiosResponse<any> | never>}
   */
  const getTransaction = transactionHash => {
    const payload = {
      jsonrpc: "2.0",
      method: "priv_getPrivateTransaction",
      params: [transactionHash],
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

  // eslint-disable-next-line no-param-reassign
  web3.priv = {
    generatePrivacyGroup,
    createPrivacyGroup,
    deletePrivacyGroup,
    findPrivacyGroup,
    distributeRawTransaction,
    getTransactionCount,
    getTransactionReceipt,
    getTransaction,
    call
  };

  /**
   * Send the Raw transaction to the Besu node
   * @param options Map to send a raw transction to besu
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
  const sendRawTransaction = options => {
    return genericSendRawTransaction(options, "eea_sendRawTransaction");
  };

  // eslint-disable-next-line no-param-reassign
  web3.eea = {
    sendRawTransaction
  };

  /**
   * Either lock or unlock the privacy group for member adding
   * @param options Map to lock the group
   * options map can contain the following:
   * privacyGroupId: Privacy group ID to lock/unlock
   * privateKey: Private Key used to sign transaction with
   * enclaveKey: Orion public key
   * lock: boolean indicating whether to lock or unlock
   * @returns {Promise<AxiosResponse<any> | never>}
   */
  const setPrivacyGroupLockState = options => {
    const contract = new web3.eth.Contract(privacyProxyAbi);
    // eslint-disable-next-line no-underscore-dangle
    const functionAbi = contract._jsonInterface.find(e => {
      return e.name === (options.lock ? "lock" : "unlock");
    });

    const functionCall = {
      to: "0x000000000000000000000000000000000000007c",
      data: functionAbi.signature,
      privateFrom: options.enclaveKey,
      privacyGroupId: options.privacyGroupId,
      privateKey: options.privateKey
    };

    return web3.eea
      .sendRawTransaction(functionCall)
      .then(async transactionHash => {
        return web3.priv.getTransactionReceipt(
          transactionHash,
          options.publicKey
        );
      });
  };

  /**
   * Create an on chain privacy group
   * @param options Map to add the members
   * options map can contain the following:
   * privacyGroupId: Privacy group ID to add to
   * privateKey: Private Key used to sign transaction with
   * enclaveKey: Orion public key
   * participants: list of enclaveKey to pass to the contract to add to the group
   * @returns {Promise<AxiosResponse<any> | never>}
   */
  const createXPrivacyGroup = options => {
    const contract = new web3.eth.Contract(privacyProxyAbi);
    // eslint-disable-next-line no-underscore-dangle
    const functionAbi = contract._jsonInterface.find(e => {
      return e.name === "addParticipants";
    });
    const functionArgs = web3.eth.abi
      .encodeParameters(functionAbi.inputs, [
        Buffer.from(options.enclaveKey, "base64"),
        options.participants.map(e => {
          return Buffer.from(e, "base64");
        })
      ])
      .slice(2);

    const functionCall = {
      to: "0x000000000000000000000000000000000000007c",
      data: functionAbi.signature + functionArgs,
      privateFrom: options.enclaveKey,
      privacyGroupId: options.privacyGroupId,
      privateKey: options.privateKey
    };
    return web3.eea.sendRawTransaction(functionCall).then(transactionHash => {
      return web3.priv.getTransactionReceipt(
        transactionHash,
        options.publicKey
      );
    });
  };

  /**
   * Add to an existing on-chain privacy group
   * @param options Map to add the members
   * options map can contain the following:
   * privacyGroupId: Privacy group ID to add to
   * privateKey: Private Key used to sign transaction with
   * enclaveKey: Orion public key
   * participants: list of enclaveKey to pass to the contract to add to the group
   * @returns {Promise<AxiosResponse<any> | never>}
   */
  const addToPrivacyGroup = options => {
    return setPrivacyGroupLockState(
      Object.assign(options, { lock: true })
    ).then(receipt => {
      if (receipt.status === "0x1") {
        return createXPrivacyGroup(options);
      }
      throw Error(
        `Locking the privacy group failed, receipt: ${JSON.stringify(receipt)}`
      );
    });
  };

  /**
   * Remove a member from an on-chain privacy group
   * @param options Map to add the members
   * options map can contain the following:
   * privacyGroupId: Privacy group ID to add to
   * privateKey: Private Key used to sign transaction with
   * enclaveKey: Orion public key
   * participant: single enclaveKey to pass to the contract to add to the group
   * @returns {Promise<AxiosResponse<any> | never>}
   */
  const removeFromPrivacyGroup = options => {
    const contract = new web3.eth.Contract(privacyProxyAbi);
    // eslint-disable-next-line no-underscore-dangle
    const functionAbi = contract._jsonInterface.find(e => {
      return e.name === "removeParticipant";
    });
    const functionArgs = web3.eth.abi
      .encodeParameters(functionAbi.inputs, [
        Buffer.from(options.enclaveKey, "base64"),
        Buffer.from(options.participant, "base64")
      ])
      .slice(2);

    const functionCall = {
      to: "0x000000000000000000000000000000000000007c",
      data: functionAbi.signature + functionArgs,
      privateFrom: options.enclaveKey,
      privacyGroupId: options.privacyGroupId,
      privateKey: options.privateKey
    };
    return web3.eea.sendRawTransaction(functionCall).then(transactionHash => {
      return web3.priv.getTransactionReceipt(
        transactionHash,
        options.publicKey
      );
    });
  };

  /**
   * Find privacy groups
   * @param options Map to find the group
   * options map can contain the following:
   * addresses: the members of the privacy group
   * @returns {Promise<privacy group | never>}
   */
  const findOnChainPrivacyGroup = options => {
    const payload = {
      jsonrpc: "2.0",
      method: "privx_findOnChainPrivacyGroup",
      params: [options.addresses],
      id: 1
    };

    return axios.post(host, payload).then(result => {
      return result.data.result;
    });
  };

  // eslint-disable-next-line no-param-reassign
  web3.privx = {
    createPrivacyGroup: createXPrivacyGroup,
    findOnChainPrivacyGroup,
    removeFromPrivacyGroup,
    addToPrivacyGroup,
    setPrivacyGroupLockState
  };

  return web3;
}

module.exports = EEAClient;
