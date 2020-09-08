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

/* eslint-disable no-underscore-dangle */
const ethUtil = require("./custom-ethjs-util");

const { BN } = ethUtil;

// secp256k1n/2
const N_DIV_2 = new BN(
  "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0",
  16
);

/**
 * Creates a new private transaction object.
 *
 * @example
 * var rawTx = {
 *   nonce: '0x00',
 *   gasPrice: '0x09184e72a000',
 *   gasLimit: '0x2710',
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: '0x00',
 *   data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057',
 *   v: '0x1c',
 *   r: '0x5e1d3a76fbf824220eafc8c79ad578ad2b67d01b0c2425eb1f1347e8f50882ab',
 *   s: '0x5bd428537f05f9830e93792f90ea6a3e2d1ee84952dd96edbae9f658f831ab13'
 *   privateFrom: 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo='
 *   privateFor: ['Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs=']
 *   restriction: 'restricted'
 * };
 * var tx = new PrivateTransaction(rawTx);
 *
 * @class
 * @param {Buffer | Array | Object} data a private transaction can be initiailized with either a buffer containing the RLP serialized private transaction or an array of buffers relating to each of the tx Properties, listed in order below in the example.
 *
 * Or lastly an Object containing the Properties of the private transaction like in the Usage example.
 *
 * For Object and Arrays each of the elements can either be a Buffer, a hex-prefixed (0x) String , Number, or an object with a toBuffer method such as Bignum
 *
 * @property {Buffer} raw The raw rlp encoded private transaction
 * @param {Buffer} data.nonce nonce number
 * @param {Buffer} data.gasLimit transaction gas limit
 * @param {Buffer} data.gasPrice transaction gas price
 * @param {Buffer} data.to to the to address
 * @param {Buffer} data.value the amount of ether sent
 * @param {Buffer} data.data this will contain the data of the message or the init of a contract
 * @param {Buffer} data.v EC recovery ID
 * @param {Buffer} data.r EC signature parameter
 * @param {Buffer} data.s EC signature parameter
 * @param {Buffer} data.privateFrom The enclave public key of the sender
 * @param {Array<Buffer>} data.privateFor The enclave public keys of the receivers
 * @param {Buffer} data.privacyGroupId The enclave id representing the group of receivers
 * @param {Buffer} data.restriction The transaction type - "restricted" or "unrestricted"
 * @param {Number} data.chainId EIP 155 chainId - mainnet: 1, ropsten:
 * */

class PrivateTransaction {
  constructor(d) {
    const data = d || {};
    // Define Properties
    const fields = [
      {
        name: "nonce",
        length: 32,
        allowLess: true,
        default: Buffer.from([])
      },
      {
        name: "gasPrice",
        length: 32,
        allowLess: true,
        default: Buffer.from([])
      },
      {
        name: "gasLimit",
        alias: "gas",
        length: 32,
        allowLess: true,
        default: Buffer.from([])
      },
      {
        name: "to",
        allowZero: true,
        length: 20,
        default: Buffer.from([])
      },
      {
        name: "value",
        length: 32,
        allowLess: true,
        default: Buffer.from([])
      },
      {
        name: "data",
        alias: "input",
        allowZero: true,
        default: Buffer.from([])
      },
      {
        name: "v",
        allowZero: true,
        default: Buffer.from([0x1c])
      },
      {
        name: "r",
        length: 32,
        allowZero: true,
        allowLess: true,
        default: Buffer.from([])
      },
      {
        name: "s",
        length: 32,
        allowZero: true,
        allowLess: true,
        default: Buffer.from([])
      },
      {
        name: "privateFrom",
        // length: 88,  //apparently the length is 0 in the test...
        default: Buffer.from([])
      },
      {
        name: "privateFor",
        nullable: true,
        allowZero: true, // if you comment out this line test fails (for now)
        bufferArray: true,
        default: [Buffer.from([])]
      },
      {
        name: "privacyGroupId",
        nullable: true,
        default: Buffer.from([])
      },
      {
        name: "restriction",
        default: Buffer.from([])
      }
    ];

    /**
     * Returns the rlp encoding of the private transaction
     * @method serialize
     * @return {Buffer}
     * @memberof PrivateTransaction
     * @name serialize
     * @see {@link https://github.com/ethereumjs/ethereumjs-util/blob/master/docs/index.md#defineproperties|ethereumjs-util}
     */
    /**
     * Returns the private transaction in JSON format
     * @method toJSON
     * @return {Array | String}
     * @memberof PrivateTransaction
     * @name toJSON
     * @see {@link https://github.com/ethereumjs/ethereumjs-util/blob/master/docs/index.md#defineproperties|ethereumjs-util}
     */
    // attached serialize
    ethUtil.defineProperties(this, fields, data);

    /**
     * @property {Buffer} from (read only) sender address of this private transaction, mathematically derived from other parameters.
     * @name from
     * @memberof PrivateTransaction
     */
    Object.defineProperty(this, "from", {
      enumerable: true,
      configurable: true,
      get: this.getSenderAddress.bind(this)
    });

    // calculate chainId from signature
    const sigV = ethUtil.bufferToInt(this.v);
    let chainId = Math.floor((sigV - 35) / 2);
    if (chainId < 0) chainId = 0;

    // set chainId
    this._chainId = chainId || data.chainId || 0;
  }

  /**
   * If the tx's `to` is to the creation address
   * @return {Boolean}
   */
  toCreationAddress() {
    return this.to.toString("hex") === "";
  }

  /**
   * Computes a sha3-256 hash of the serialized tx
   * @param {Boolean} [includeSignature=true] whether or not to inculde the signature
   * @return {Buffer}
   */
  hash(includeSignature) {
    // eslint-disable-next-line no-param-reassign
    if (includeSignature === undefined) includeSignature = true;

    // EIP155 spec:
    // when computing the hash of a transaction for purposes of signing or recovering,
    // instead of hashing only the first six elements (ie. nonce, gasprice, startgas, to, value, data),
    // hash nine elements, with v replaced by CHAIN_ID, r = 0 and s = 0

    let items;
    if (includeSignature) {
      items = this.raw;
    } else if (this._chainId > 0) {
      const raw = this.raw.slice();
      this.v = this._chainId;
      this.r = 0;
      this.s = 0;
      items = this.raw;
      this.raw = raw;
    } else {
      items = this.raw.slice(0, 6);
    }

    const arr = items.slice();

    if (items[10][0].length !== 0 && items[11].length === 32) {
      throw Error(
        "privacyGroupId and privateFor fields are mutually exclusive"
      );
    }

    if (items[11].length === 32) {
      arr.splice(10, 1);
    } else {
      arr.splice(11, 1);
    }

    // create hash
    return ethUtil.rlphash(arr);
  }

  /**
   * returns chain ID
   * @return {Buffer}
   */
  getChainId() {
    return this._chainId;
  }

  /**
   * returns the sender's address
   * @return {Buffer}
   */
  getSenderAddress() {
    if (this._from) {
      return this._from;
    }
    const pubkey = this.getSenderPublicKey();
    this._from = ethUtil.publicToAddress(pubkey);
    return this._from;
  }

  /**
   * returns the public key of the sender
   * @return {Buffer}
   */
  getSenderPublicKey() {
    if (!this._senderPubKey || !this._senderPubKey.length) {
      if (!this.verifySignature()) throw new Error("Invalid Signature");
    }
    return this._senderPubKey;
  }

  /**
   * Determines if the signature is valid
   * @return {Boolean}
   */
  verifySignature() {
    const msgHash = this.hash(false);
    // All transaction signatures whose s-value is greater than secp256k1n/2 are considered invalid.
    if (new BN(this.s).cmp(N_DIV_2) === 1) {
      return false;
    }

    try {
      let v = ethUtil.bufferToInt(this.v);
      if (this._chainId > 0) {
        v -= this._chainId * 2 + 8;
      }
      this._senderPubKey = ethUtil.ecrecover(msgHash, v, this.r, this.s);
    } catch (e) {
      return false;
    }

    return !!this._senderPubKey;
  }

  /**
   * sign a private transaction with a given private key
   * @param {Buffer} privateKey Must be 32 bytes in length
   */
  sign(privateKey) {
    const msgHash = this.hash(false);
    const sig = ethUtil.ecsign(msgHash, privateKey);
    if (this._chainId > 0) {
      sig.v += this._chainId * 2 + 8;
    }
    Object.assign(this, sig);
  }

  /**
   * The amount of gas paid for the data in this tx
   * @return {BN}
   */
  getDataFee() {
    const data = this.raw[5];
    const cost = new BN(0);
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < data.length; i++) {
      // eslint-disable-next-line no-unused-expressions
      data[i] === 0
        ? cost.iaddn(this._common.param("gasPrices", "txDataZero"))
        : cost.iaddn(this._common.param("gasPrices", "txDataNonZero"));
    }
    return cost;
  }

  /**
   * the minimum amount of gas the tx must have (DataFee + TxFee + Creation Fee)
   * @return {BN}
   */
  getBaseFee() {
    const fee = this.getDataFee().iaddn(this._common.param("gasPrices", "tx"));
    if (this._common.gteHardfork("homestead") && this.toCreationAddress()) {
      fee.iaddn(this._common.param("gasPrices", "txCreation"));
    }
    return fee;
  }

  /**
   * the up front amount that an account must have for this private transaction to be valid
   * @return {BN}
   */
  getUpfrontCost() {
    return new BN(this.gasLimit)
      .imul(new BN(this.gasPrice))
      .iadd(new BN(this.value));
  }

  /**
   * validates the signature and checks to see if it has enough gas
   * @param {Boolean} [stringError=false] whether to return a string with a description of why the validation failed or return a Boolean
   * @return {Boolean|String}
   */
  validate(stringError) {
    const errors = [];
    if (!this.verifySignature()) {
      errors.push("Invalid Signature");
    }

    if (this.getBaseFee().cmp(new BN(this.gasLimit)) > 0) {
      errors.push([`gas limit is too low. Need at least ${this.getBaseFee()}`]);
    }

    if (stringError === undefined || stringError === false) {
      return errors.length === 0;
    }
    return errors.join(" ");
  }
}

module.exports = PrivateTransaction;
