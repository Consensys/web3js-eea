/*
 * Copyright ConsenSys Software Inc.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at 
 *
 * http://mozilla.org/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * SPDX-License-Identifier: MPL-2.0
 */

const crypto = require("crypto");

const { privateToAddress } = require("./custom-ethjs-util");
const privacyProxyAbi = require("./solidity/PrivacyProxy.json").output.abi;
const PrivateTransaction = require("./privateTransaction");
const { generatePrivacyGroup } = require("./privacyGroup");
const { PrivateSubscription } = require("./privateSubscription");

/**
 * Handles elements
 * @name EEAClient
 * @class EEAClient
 */
function EEAClient(web3, chainId) {
  const GAS_PRICE = 0;
  const GAS_LIMIT = 3000000;

  if (web3.currentProvider == null) {
    throw new Error("Missing provider");
  }

  /* eslint-disable no-param-reassign */
  // Initialize the extensions
  web3.priv = {
    subscriptionPollingInterval: 1000
  };
  web3.eea = {};
  web3.privx = {};
  /* eslint-enable no-param-reassign */

  // INTERNAL ==========
  web3.extend({
    property: "privInternal",
    methods: [
      // eea
      {
        name: "sendRawTransaction",
        call: "eea_sendRawTransaction",
        params: 1
      },
      // priv
      {
        name: "call",
        call: "priv_call",
        params: 3,
        inputFormatter: [
          null, // privacyGroupId
          null, // tx
          web3.extend.formatters.inputDefaultBlockNumberFormatter
        ]
      },
      {
        name: "getTransactionCount",
        call: "priv_getTransactionCount",
        params: 2,
        outputFormatter: output => {
          return parseInt(output, 16);
        }
      },
      {
        name: "getTransactionReceipt",
        call: "priv_getTransactionReceipt",
        params: 2
      },
      {
        name: "distributeRawTransaction",
        call: "priv_distributeRawTransaction",
        params: 1
      },
      {
        name: "findPrivacyGroup",
        call: "priv_findPrivacyGroup",
        params: 1
      },
      {
        name: "deletePrivacyGroup",
        call: "priv_deletePrivacyGroup",
        params: 1
      },
      {
        name: "subscribe",
        call: "priv_subscribe",
        params: 3 // type, privacyGroupId, filter
      },
      {
        name: "unsubscribe",
        call: "priv_unsubscribe",
        params: 2 // privacyGroupId, filterId
      },
      // privx
      {
        name: "findOnChainPrivacyGroup",
        call: "privx_findOnChainPrivacyGroup",
        params: 1
      }
    ]
  });

  /**
   * Send a transaction to `eea_sendRawTransaction` or `priv_distributeRawTransaction`
   * @param options Used to create the private transaction
   * - options.privateKey
   * - options.privateFrom
   * - options.privacyGroupId
   * - options.privateFor
   * - options.nonce
   * - options.to
   * - options.data
   */
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

        let result;
        if (method === "eea_sendRawTransaction") {
          result = web3.privInternal.sendRawTransaction(signedRlpEncoded);
        } else if (method === "priv_distributeRawTransaction") {
          result = web3.privInternal.distributeRawTransaction(signedRlpEncoded);
        }

        if (result != null) {
          return result;
        }

        throw new Error(`Unknown method ${method}`);
      });
  };

  /**
   * Returns the Private Marker transaction
   * @param {string} txHash The transaction hash
   * @param {int} retries Number of retries to be made to get the private marker transaction receipt
   * @param {int} delay The delay between the retries
   * @returns Promise to resolve the private marker transaction receipt
   * @memberOf EEAClient
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

  // PRIV ==========
  web3.extend({
    property: "priv",
    methods: [
      {
        name: "createPrivacyGroup",
        call: "priv_createPrivacyGroup",
        params: 1
      },
      {
        name: "getTransaction",
        call: "priv_getPrivateTransaction",
        params: 1
      },
      {
        name: "getPastLogs",
        call: "priv_getLogs",
        params: 3,
        inputFormatter: [
          null,
          null,
          web3.extend.formatters.inputDefaultBlockNumberFormatter
        ],
        outputFormatter: web3.extend.outputLogFormatter
      },
      {
        name: "createFilter",
        call: "priv_newFilter",
        params: 3,
        inputFormatter: [
          null,
          null,
          web3.extend.formatters.inputDefaultBlockNumberFormatter
        ]
      },
      {
        name: "getFilterLogs",
        call: "priv_getFilterLogs",
        params: 2,
        outputFormatter: web3.extend.outputLogFormatter
      },
      {
        name: "getFilterChanges",
        call: "priv_getFilterChanges",
        params: 2,
        outputFormatter: web3.extend.outputLogFormatter
      },
      {
        name: "uninstallFilter",
        call: "priv_uninstallFilter",
        params: 2
      }
    ]
  });

  /**
   * Get the transaction count
   * @param options Options passed into `eea_sendRawTransaction`
   * @returns Promise<transaction count | never>
   * @memberOf EEAClient
   */
  const getTransactionCount = options => {
    let privacyGroupId;
    if (options.privacyGroupId) {
      ({ privacyGroupId } = options);
    } else {
      privacyGroupId = generatePrivacyGroup(options);
    }

    return web3.privInternal.getTransactionCount(options.from, privacyGroupId);
  };

  /**
   * Delete a privacy group
   * @param options Options passed into `deletePrivacyGroup`
   * - options.privacyGroupId
   * @returns Promise<transaction count | never>
   * @memberOf EEAClient
   */
  const deletePrivacyGroup = options => {
    // TODO: remove this function and pass arguments individually (breaks API)
    return web3.privInternal.deletePrivacyGroup(options.privacyGroupId);
  };

  /**
   * Find privacy groups
   * @param options Options passed into `findPrivacyGroup`
   * - options.addresses
   * @returns Promise<transaction count | never>
   */
  const findPrivacyGroup = options => {
    // TODO: remove this function and pass arguments individually(breaks API)
    return web3.privInternal.findPrivacyGroup(options.addresses);
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
    return getMarkerTransaction(txHash, retries, delay).then(() => {
      return web3.privInternal.getTransactionReceipt(txHash, enclavePublicKey);
    });
  };

  /**
   * Invokes a private contract function locally
   * @param options Options passed into `priv_call`
   * options map can contain the following:
   * - **privacyGroupId:** Enclave id representing the receivers of the transaction
   * - **to:** Contract address,
   * - **data:** Encoded function call (signature + data)
   * - **blockNumber:** Blocknumber defaults to "latest"
   * @returns {Promise<AxiosResponse<T>>}
   */
  const call = options => {
    const txCall = {};
    txCall.to = options.to;
    txCall.data = options.data;

    return web3.privInternal.call(
      options.privacyGroupId,
      txCall,
      options.blockNumber
    );
  };

  /**
   * Subscribe to new logs matching a filter
   *
   * If the provider supports subscriptions, it uses `priv_subscribe`, otherwise
   * it uses polling and `priv_getFilterChanges` to get new logs. Returns an
   * error to the callback if there is a problem subscribing or creating the filter.
   * @param {string} privacyGroupId
   * @param {*} filter
   * @param {function} callback returns the filter/subscription ID, or an error
   * @return {PrivateSubscription} a subscription object that manages the
   * lifecycle of the filter or subscription
   */
  const subscribe = async (privacyGroupId, filter, callback) => {
    const sub = new PrivateSubscription(web3, privacyGroupId, filter);

    let filterId;
    try {
      filterId = await sub.subscribe();
      callback(undefined, filterId);
    } catch (error) {
      callback(error);
    }

    return sub;
  };

  Object.assign(web3.priv, {
    generatePrivacyGroup,
    deletePrivacyGroup,
    findPrivacyGroup,
    distributeRawTransaction,
    getTransactionCount,
    getTransactionReceipt,
    call,
    subscribe
  });

  // EEA ==========

  /**
   * Send the Raw transaction to the Besu node
   * @param options Map to send a raw transaction to besu
   * options map can contain the following:
   * - privateKey : Private Key used to sign transaction with
   * - privateFrom : Enclave public key
   * - privateFor : Enclave keys to send the transaction to
   * - privacyGroupId : Enclave id representing the receivers of the transaction
   * - nonce(Optional) : If not provided, will be calculated using `eea_getTransctionCount`
   * - to : The address to send the transaction
   * - data : Data to be sent in the transaction
   *
   * @returns {Promise<AxiosResponse<any> | never>}
   */
  const sendRawTransaction = options => {
    return genericSendRawTransaction(options, "eea_sendRawTransaction");
  };

  Object.assign(web3.eea, {
    sendRawTransaction
  });

  // PRIVX ==========

  /**
   * Either lock or unlock the privacy group for member adding
   * @param options Map to lock the group
   * options map can contain the following:
   * - **privacyGroupId:** Privacy group ID to lock/unlock
   * - **privateKey:** Private Key used to sign transaction with
   * - **enclaveKey:** Orion public key
   * - **lock:** boolean indicating whether to lock or unlock
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
   * - **privacyGroupId:** Privacy group ID to add to
   * - **privateKey:** Private Key used to sign transaction with
   * - **enclaveKey:** Orion public key
   * - **participants:** list of enclaveKey to pass to the contract to add to the group
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
        options.participants.map(e => {
          return Buffer.from(e, "base64");
        })
      ])
      .slice(2);

    // Generate a random ID if one was not passed in
    const privacyGroupId =
      options.privacyGroupId || crypto.randomBytes(32).toString("base64");

    const functionCall = {
      to: "0x000000000000000000000000000000000000007c",
      data: functionAbi.signature + functionArgs,
      privateFrom: options.enclaveKey,
      privacyGroupId,
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
   *
   * - **privacyGroupId:** Privacy group ID to add to
   * - **privateKey:** Private Key used to sign transaction with
   * - **enclaveKey:** Orion public key
   * - **participants:** list of enclaveKey to pass to the contract to add to the group
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
   * - **privacyGroupId:** Privacy group ID to add to
   * - **privateKey:** Private Key used to sign transaction with
   * - **enclaveKey:** Orion public key
   * - **participant:** single enclaveKey to pass to the contract to add to the group
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
   * - **addresses:** the members of the privacy group
   * @returns Promise<privacy group | never>
   */
  const findOnChainPrivacyGroup = options => {
    // TODO: remove this function and pass arguments individually (breaks API)
    return web3.privInternal.findOnChainPrivacyGroup(options.addresses);
  };

  Object.assign(web3.privx, {
    createPrivacyGroup: createXPrivacyGroup,
    findOnChainPrivacyGroup,
    removeFromPrivacyGroup,
    addToPrivacyGroup,
    setPrivacyGroupLockState
  });

  return web3;
}

module.exports = EEAClient;
