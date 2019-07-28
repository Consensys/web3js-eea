/* eslint-disable */

const _typeof =
  typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? function(obj) {
        return typeof obj;
      }
    : function(obj) {
        return obj &&
          typeof Symbol === "function" &&
          obj.constructor === Symbol &&
          obj !== Symbol.prototype
          ? "symbol"
          : typeof obj;
      };

const createKeccakHash = require("keccak");
const secp256k1 = require("secp256k1");
const assert = require("assert");
const rlp = require("rlp");
const BN = require("bn.js");
const createHash = require("create-hash");
const { Buffer } = require("safe-buffer");
Object.assign(exports, require("ethjs-util"));

/**
 * the max integer that this VM can handle (a ```BN```)
 * @var {BN} MAX_INTEGER
 */
exports.MAX_INTEGER = new BN(
  "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
  16
);

/**
 * 2^256 (a ```BN```)
 * @var {BN} TWO_POW256
 */
exports.TWO_POW256 = new BN(
  "10000000000000000000000000000000000000000000000000000000000000000",
  16
);

/**
 * Keccak-256 hash of null (a ```String```)
 * @var {String} KECCAK256_NULL_S
 */
exports.KECCAK256_NULL_S =
  "c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
exports.SHA3_NULL_S = exports.KECCAK256_NULL_S;

/**
 * Keccak-256 hash of null (a ```Buffer```)
 * @var {Buffer} KECCAK256_NULL
 */
exports.KECCAK256_NULL = Buffer.from(exports.KECCAK256_NULL_S, "hex");
exports.SHA3_NULL = exports.KECCAK256_NULL;

/**
 * Keccak-256 of an RLP of an empty array (a ```String```)
 * @var {String} KECCAK256_RLP_ARRAY_S
 */
exports.KECCAK256_RLP_ARRAY_S =
  "1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347";
exports.SHA3_RLP_ARRAY_S = exports.KECCAK256_RLP_ARRAY_S;

/**
 * Keccak-256 of an RLP of an empty array (a ```Buffer```)
 * @var {Buffer} KECCAK256_RLP_ARRAY
 */
exports.KECCAK256_RLP_ARRAY = Buffer.from(exports.KECCAK256_RLP_ARRAY_S, "hex");
exports.SHA3_RLP_ARRAY = exports.KECCAK256_RLP_ARRAY;

/**
 * Keccak-256 hash of the RLP of null  (a ```String```)
 * @var {String} KECCAK256_RLP_S
 */
exports.KECCAK256_RLP_S =
  "56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421";
exports.SHA3_RLP_S = exports.KECCAK256_RLP_S;

/**
 * Keccak-256 hash of the RLP of null (a ```Buffer```)
 * @var {Buffer} KECCAK256_RLP
 */
exports.KECCAK256_RLP = Buffer.from(exports.KECCAK256_RLP_S, "hex");
exports.SHA3_RLP = exports.KECCAK256_RLP;

/**
 * [`BN`](https://github.com/indutny/bn.js)
 * @var {Function}
 */
exports.BN = BN;

/**
 * [`rlp`](https://github.com/ethereumjs/rlp)
 * @var {Function}
 */
exports.rlp = rlp;

/**
 * [`secp256k1`](https://github.com/cryptocoinjs/secp256k1-node/)
 * @var {Object}
 */
exports.secp256k1 = secp256k1;

/**
 * Returns a buffer filled with 0s
 * @method zeros
 * @param {Number} bytes  the number of bytes the buffer should be
 * @return {Buffer}
 */
exports.zeros = function(bytes) {
  return Buffer.allocUnsafe(bytes).fill(0);
};

/**
 * Returns a zero address
 * @method zeroAddress
 * @return {String}
 */
exports.zeroAddress = function() {
  const addressLength = 20;
  const zeroAddress = exports.zeros(addressLength);
  return exports.bufferToHex(zeroAddress);
};

/**
 * Left Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @method lsetLength
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @param {Boolean} [right=false] whether to start padding form the left or right
 * @return {Buffer|Array}
 */
exports.setLengthLeft = exports.setLength = function(msg, length, right) {
  const buf = exports.zeros(length);
  msg = exports.toBuffer(msg);
  if (right) {
    if (msg.length < length) {
      msg.copy(buf);
      return buf;
    }
    return msg.slice(0, length);
  }
  if (msg.length < length) {
    msg.copy(buf, length - msg.length);
    return buf;
  }
  return msg.slice(-length);
};

/**
 * Right Pads an `Array` or `Buffer` with leading zeros till it has `length` bytes.
 * Or it truncates the beginning if it exceeds.
 * @param {Buffer|Array} msg the value to pad
 * @param {Number} length the number of bytes the output should be
 * @return {Buffer|Array}
 */
exports.setLengthRight = function(msg, length) {
  return exports.setLength(msg, length, true);
};

/**
 * Trims leading zeros from a `Buffer` or an `Array`
 * @param {Buffer|Array|String} a
 * @return {Buffer|Array|String}
 */
exports.unpad = exports.stripZeros = function(a) {
  a = exports.stripHexPrefix(a);
  let first = a[0];
  while (a.length > 0 && first.toString() === "0") {
    a = a.slice(1);
    first = a[0];
  }
  return a;
};
/**
 * Attempts to turn a value into a `Buffer`. As input it supports `Buffer`, `String`, `Number`, null/undefined, `BN` and other objects with a `toArray()` method.
 * @param {*} v the value
 */
exports.toBuffer = function(v) {
  if (!Buffer.isBuffer(v)) {
    if (Array.isArray(v)) {
      v = Buffer.from(v);
    } else if (typeof v === "string") {
      if (exports.isHexString(v)) {
        v = Buffer.from(exports.padToEven(exports.stripHexPrefix(v)), "hex");
      } else if (v.match(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/)) {
      //   ^                        # Start of input
      //   ([0-9a-zA-Z+/]{4})*      # Groups of 4 valid characters decode
      //                            # to 24 bits of data for each group
      //   (                        # Either ending with:
      //   ([0-9a-zA-Z+/]{2}==)     # two valid characters followed by ==
      //   |                        # , or
      //   ([0-9a-zA-Z+/]{3}=)      # three valid characters followed by =
      //   )?                       # , or nothing
      //   $                        # End of input
        v = Buffer.from(v, "base64");
      } else {
        v = Buffer.from(v);
      }
    } else if (typeof v === "number") {
      v = exports.intToBuffer(v);
    } else if (v === null || v === undefined) {
      v = Buffer.allocUnsafe(0);
    } else if (BN.isBN(v)) {
      v = v.toArrayLike(Buffer);
    } else if (v.toArray) {
      // converts a BN to a Buffer
      v = Buffer.from(v.toArray());
    } else {
      throw new Error("invalid type");
    }
  }
  return v;
};

/**
 * Converts a `Buffer` to a `Number`
 * @param {Buffer} buf
 * @return {Number}
 * @throws If the input number exceeds 53 bits.
 */
exports.bufferToInt = function(buf) {
  return new BN(exports.toBuffer(buf)).toNumber();
};

/**
 * Converts a `Buffer` into a hex `String`
 * @param {Buffer} buf
 * @return {String}
 */
exports.bufferToHex = function(buf) {
  buf = exports.toBuffer(buf);
  return `0x${buf.toString("hex")}`;
};

/**
 * Interprets a `Buffer` as a signed integer and returns a `BN`. Assumes 256-bit numbers.
 * @param {Buffer} num
 * @return {BN}
 */
exports.fromSigned = function(num) {
  return new BN(num).fromTwos(256);
};

/**
 * Converts a `BN` to an unsigned integer and returns it as a `Buffer`. Assumes 256-bit numbers.
 * @param {BN} num
 * @return {Buffer}
 */
exports.toUnsigned = function(num) {
  return Buffer.from(num.toTwos(256).toArray());
};

/**
 * Creates Keccak hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the Keccak width
 * @return {Buffer}
 */
exports.keccak = function(a, bits) {
  a = exports.toBuffer(a);
  if (!bits) bits = 256;

  return createKeccakHash(`keccak${bits}`)
    .update(a)
    .digest();
};

/**
 * Creates Keccak-256 hash of the input, alias for keccak(a, 256)
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.keccak256 = function(a) {
  return exports.keccak(a);
};

/**
 * Creates SHA-3 (Keccak) hash of the input [OBSOLETE]
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Number} [bits=256] the SHA-3 width
 * @return {Buffer}
 */
exports.sha3 = exports.keccak;

/**
 * Creates SHA256 hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.sha256 = function(a) {
  a = exports.toBuffer(a);
  return createHash("sha256")
    .update(a)
    .digest();
};

/**
 * Creates RIPEMD160 hash of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @param {Boolean} padded whether it should be padded to 256 bits or not
 * @return {Buffer}
 */
exports.ripemd160 = function(a, padded) {
  a = exports.toBuffer(a);
  const hash = createHash("rmd160")
    .update(a)
    .digest();
  if (padded === true) {
    return exports.setLength(hash, 32);
  }
  return hash;
};

/**
 * Creates SHA-3 hash of the RLP encoded version of the input
 * @param {Buffer|Array|String|Number} a the input data
 * @return {Buffer}
 */
exports.rlphash = function(a) {
  return exports.keccak(rlp.encode(a));
};

/**
 * Checks if the private key satisfies the rules of the curve secp256k1.
 * @param {Buffer} privateKey
 * @return {Boolean}
 */
exports.isValidPrivate = function(privateKey) {
  return secp256k1.privateKeyVerify(privateKey);
};

/**
 * Checks if the public key satisfies the rules of the curve secp256k1
 * and the requirements of Ethereum.
 * @param {Buffer} publicKey The two points of an uncompressed key, unless sanitize is enabled
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Boolean}
 */
exports.isValidPublic = function(publicKey, sanitize) {
  if (publicKey.length === 64) {
    // Convert to SEC1 for secp256k1
    return secp256k1.publicKeyVerify(
      Buffer.concat([Buffer.from([4]), publicKey])
    );
  }

  if (!sanitize) {
    return false;
  }

  return secp256k1.publicKeyVerify(publicKey);
};

/**
 * Returns the ethereum address of a given public key.
 * Accepts "Ethereum public keys" and SEC1 encoded keys.
 * @param {Buffer} pubKey The two points of an uncompressed key, unless sanitize is enabled
 * @param {Boolean} [sanitize=false] Accept public keys in other formats
 * @return {Buffer}
 */
exports.pubToAddress = exports.publicToAddress = function(pubKey, sanitize) {
  pubKey = exports.toBuffer(pubKey);
  if (sanitize && pubKey.length !== 64) {
    pubKey = secp256k1.publicKeyConvert(pubKey, false).slice(1);
  }
  assert(pubKey.length === 64);
  // Only take the lower 160bits of the hash
  return exports.keccak(pubKey).slice(-20);
};

/**
 * Returns the ethereum public key of a given private key
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
const privateToPublic = (exports.privateToPublic = function(privateKey) {
  privateKey = exports.toBuffer(privateKey);
  // skip the type flag and use the X, Y points
  return secp256k1.publicKeyCreate(privateKey, false).slice(1);
});

/**
 * Converts a public key to the Ethereum format.
 * @param {Buffer} publicKey
 * @return {Buffer}
 */
exports.importPublic = function(publicKey) {
  publicKey = exports.toBuffer(publicKey);
  if (publicKey.length !== 64) {
    publicKey = secp256k1.publicKeyConvert(publicKey, false).slice(1);
  }
  return publicKey;
};

/**
 * ECDSA sign
 * @param {Buffer} msgHash
 * @param {Buffer} privateKey
 * @return {Object}
 */
exports.ecsign = function(msgHash, privateKey) {
  const sig = secp256k1.sign(msgHash, privateKey);

  const ret = {};
  ret.r = sig.signature.slice(0, 32);
  ret.s = sig.signature.slice(32, 64);
  ret.v = sig.recovery + 27;
  return ret;
};

/**
 * Returns the keccak-256 hash of `message`, prefixed with the header used by the `eth_sign` RPC call.
 * The output of this function can be fed into `ecsign` to produce the same signature as the `eth_sign`
 * call for a given `message`, or fed to `ecrecover` along with a signature to recover the public key
 * used to produce the signature.
 * @param message
 * @returns {Buffer} hash
 */
exports.hashPersonalMessage = function(message) {
  const prefix = exports.toBuffer(
    `\x19Ethereum Signed Message:\n${message.length.toString()}`
  );
  return exports.keccak(Buffer.concat([prefix, message]));
};

/**
 * ECDSA public key recovery from signature
 * @param {Buffer} msgHash
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @return {Buffer} publicKey
 */
exports.ecrecover = function(msgHash, v, r, s) {
  const signature = Buffer.concat(
    [exports.setLength(r, 32), exports.setLength(s, 32)],
    64
  );
  const recovery = v - 27;
  if (recovery !== 0 && recovery !== 1) {
    throw new Error("Invalid signature v value");
  }
  const senderPubKey = secp256k1.recover(msgHash, signature, recovery);
  return secp256k1.publicKeyConvert(senderPubKey, false).slice(1);
};

/**
 * Convert signature parameters into the format of `eth_sign` RPC method
 * @param {Number} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @return {String} sig
 */
exports.toRpcSig = function(v, r, s) {
  // NOTE: with potential introduction of chainId this might need to be updated
  if (v !== 27 && v !== 28) {
    throw new Error("Invalid recovery id");
  }

  // geth (and the RPC eth_sign method) uses the 65 byte format used by Bitcoin
  // FIXME: this might change in the future - https://github.com/ethereum/go-ethereum/issues/2053
  return exports.bufferToHex(
    Buffer.concat([
      exports.setLengthLeft(r, 32),
      exports.setLengthLeft(s, 32),
      exports.toBuffer(v - 27)
    ])
  );
};

/**
 * Convert signature format of the `eth_sign` RPC method to signature parameters
 * NOTE: all because of a bug in geth: https://github.com/ethereum/go-ethereum/issues/2053
 * @param {String} sig
 * @return {Object}
 */
exports.fromRpcSig = function(sig) {
  sig = exports.toBuffer(sig);

  // NOTE: with potential introduction of chainId this might need to be updated
  if (sig.length !== 65) {
    throw new Error("Invalid signature length");
  }

  let v = sig[64];
  // support both versions of `eth_sign` responses
  if (v < 27) {
    v += 27;
  }

  return {
    v,
    r: sig.slice(0, 32),
    s: sig.slice(32, 64)
  };
};

/**
 * Returns the ethereum address of a given private key
 * @param {Buffer} privateKey A private key must be 256 bits wide
 * @return {Buffer}
 */
exports.privateToAddress = function(privateKey) {
  return exports.publicToAddress(privateToPublic(privateKey));
};

/**
 * Checks if the address is a valid. Accepts checksummed addresses too
 * @param {String} address
 * @return {Boolean}
 */
exports.isValidAddress = function(address) {
  return /^0x[0-9a-fA-F]{40}$/.test(address);
};

/**
 * Checks if a given address is a zero address
 * @method isZeroAddress
 * @param {String} address
 * @return {Boolean}
 */
exports.isZeroAddress = function(address) {
  const zeroAddress = exports.zeroAddress();
  return zeroAddress === exports.addHexPrefix(address);
};

/**
 * Returns a checksummed address
 * @param {String} address
 * @return {String}
 */
exports.toChecksumAddress = function(address) {
  address = exports.stripHexPrefix(address).toLowerCase();
  const hash = exports.keccak(address).toString("hex");
  let ret = "0x";

  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      ret += address[i].toUpperCase();
    } else {
      ret += address[i];
    }
  }

  return ret;
};

/**
 * Checks if the address is a valid checksummed address
 * @param {Buffer} address
 * @return {Boolean}
 */
exports.isValidChecksumAddress = function(address) {
  return (
    exports.isValidAddress(address) &&
    exports.toChecksumAddress(address) === address
  );
};

/**
 * Generates an address of a newly created contract
 * @param {Buffer} from the address which is creating this new address
 * @param {Buffer} nonce the nonce of the from account
 * @return {Buffer}
 */
exports.generateAddress = function(from, nonce) {
  from = exports.toBuffer(from);
  nonce = new BN(nonce);

  if (nonce.isZero()) {
    // in RLP we want to encode null in the case of zero nonce
    // read the RLP documentation for an answer if you dare
    nonce = null;
  } else {
    nonce = Buffer.from(nonce.toArray());
  }

  // Only take the lower 160bits of the hash
  return exports.rlphash([from, nonce]).slice(-20);
};

/**
 * Returns true if the supplied address belongs to a precompiled account (Byzantium)
 * @param {Buffer|String} address
 * @return {Boolean}
 */
exports.isPrecompiled = function(address) {
  const a = exports.unpad(address);
  return a.length === 1 && a[0] >= 1 && a[0] <= 8;
};

/**
 * Adds "0x" to a given `String` if it does not already start with "0x"
 * @param {String} str
 * @return {String}
 */
exports.addHexPrefix = function(str) {
  if (typeof str !== "string") {
    return str;
  }

  return exports.isHexPrefixed(str) ? str : `0x${str}`;
};

/**
 * Validate ECDSA signature
 * @method isValidSignature
 * @param {Buffer} v
 * @param {Buffer} r
 * @param {Buffer} s
 * @param {Boolean} [homestead=true]
 * @return {Boolean}
 */

exports.isValidSignature = function(v, r, s, homestead) {
  const SECP256K1_N_DIV_2 = new BN(
    "7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0",
    16
  );
  const SECP256K1_N = new BN(
    "fffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141",
    16
  );

  if (r.length !== 32 || s.length !== 32) {
    return false;
  }

  if (v !== 27 && v !== 28) {
    return false;
  }

  r = new BN(r);
  s = new BN(s);

  if (r.isZero() || r.gt(SECP256K1_N) || s.isZero() || s.gt(SECP256K1_N)) {
    return false;
  }

  if (homestead === false && new BN(s).cmp(SECP256K1_N_DIV_2) === 1) {
    return false;
  }

  return true;
};

/**
 * Converts a `Buffer` or `Array` to JSON
 * @param {Buffer|Array} ba
 * @return {Array|String|null}
 */
exports.baToJSON = function(ba) {
  if (Buffer.isBuffer(ba)) {
    return `0x${ba.toString("hex")}`;
  }
  if (ba instanceof Array) {
    const array = [];
    for (let i = 0; i < ba.length; i++) {
      array.push(exports.baToJSON(ba[i]));
    }
    return array;
  }
};

/**
 * Defines properties on a `Object`. It make the assumption that underlying data is binary.
 * @param {Object} self the `Object` to define properties on
 * @param {Array} fields an array fields to define. Fields can contain:
 * * `name` - the name of the properties
 * * `length` - the number of bytes the field can have
 * * `allowLess` - if the field can be less than the length
 * * `allowEmpty`
 * @param {*} data data to be validated against the definitions
 */
exports.defineProperties = function(self, fields, data) {
  self.raw = [];
  self._fields = [];

  // attach the `toJSON`
  self.toJSON = function(label) {
    if (label) {
      const obj = {};
      self._fields.forEach(function(field) {
        obj[field] = `0x${self[field].toString("hex")}`;
      });
      return obj;
    }
    return exports.baToJSON(this.raw);
  };

  self.serialize = function serialize() {
    const arr = self.raw.slice();

    if (self.raw[10][0].length !== 0
      && self.raw[11].length === 32) {
      throw Error("privacyGroupId and privateFor fields are mutually exclusive");
    }

    if (self.raw[11].length === 32) {
      arr.splice(10, 1)
    } else {
      arr.splice(11, 1)
    }

    return rlp.encode(arr);
  };

  fields.forEach(function(field, i) {
    self._fields.push(field.name);
    function getter() {
      return self.raw[i];
    }
    function setter(v) {
      if (field.bufferArray) {
        v = v.map(exports.toBuffer);
      } else {
        v = exports.toBuffer(v);
      }

      if (v.toString("hex") === "00" && !field.allowZero) {
        v = Buffer.allocUnsafe(0);
      }

      if (field.allowLess && field.length) {
        v = exports.stripZeros(v);
        assert(
          field.length >= v.length,
          `The field ${field.name} must not have more ${field.length} bytes`
        );
      } else if (!(field.allowZero && v.length === 0) && field.length) {
        assert(
          field.length === v.length,
          `The field ${field.name} must have byte length of ${field.length}`
        );
      }

      self.raw[i] = v;
    }

    Object.defineProperty(self, field.name, {
      enumerable: true,
      configurable: true,
      get: getter,
      set: setter
    });

    if (field.default) {
      self[field.name] = field.default;
    }

    // attach alias
    if (field.alias) {
      Object.defineProperty(self, field.alias, {
        enumerable: false,
        configurable: true,
        set: setter,
        get: getter
      });
    }
  });

  // if the constuctor is passed data
  if (data) {
    if (typeof data === "string") {
      data = Buffer.from(exports.stripHexPrefix(data), "hex");
    }

    if (Buffer.isBuffer(data)) {
      data = rlp.decode(data);
    }

    if (Array.isArray(data)) {
      if (data.length === 12) {
        if (data[10].constructor === Array) {
          data.splice(11, 0, "");
        } else {
          data.splice(10, 0, []);
        }
      }
      if (data.length !== self._fields.length) {
        throw new Error("wrong number of fields in data");
      }

      // make sure all the items are buffers
      data.forEach(function(d, i) {
        let v;
        if (fields[i].bufferArray) {
          v = d.map(exports.toBuffer);
        } else {
          v = exports.toBuffer(d);
        }
        self[self._fields[i]] = v;
      });
    } else if (
      (typeof data === "undefined" ? "undefined" : _typeof(data)) === "object"
    ) {
      const keys = Object.keys(data);
      fields.forEach(function(field) {
        if (keys.indexOf(field.name) !== -1)
          self[field.name] = data[field.name];
        if (keys.indexOf(field.alias) !== -1)
          self[field.alias] = data[field.alias];
      });
    } else {
      throw new Error("invalid data");
    }
  }
};
