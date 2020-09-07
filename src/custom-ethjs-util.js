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

/* eslint-disable */
const assert = require("assert");

const ethUtils = require("ethereumjs-util");
const { BN, rlp } = ethUtils;

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


/**
 * Attempts to turn a value into a `Buffer`. As input it supports `Buffer`, `String`, `Number`, null/undefined, `BN` and other objects with a `toArray()` method.
 * @param {*} v the value
 */
function toBuffer(v) {
  if (!Buffer.isBuffer(v)) {
    if (Array.isArray(v)) {
      v = Buffer.from(v);
    } else if (typeof v === "string") {
      if (ethUtils.isHexString(v)) {
        v = Buffer.from(ethUtils.padToEven(ethUtils.stripHexPrefix(v)), "hex");
      } else if (
        v.match(
          /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/
        )
      ) {
        // handle base64 strings, i.e. privacyGroupId
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
      } else if (v === "restricted" || v === "unrestricted") {
        // handle restriction field
        v = Buffer.from(v);
      } else {
        throw new Error(
          `Cannot convert string to buffer. toBuffer only supports 0x-prefixed hex strings and this string was given: ${v}`
        );
      }
    } else if (typeof v === "number") {
      v = ethUtils.intToBuffer(v);
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
}

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
function defineProperties(self, fields, data) {
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
    return ethUtils.baToJSON(this.raw);
  };

  self.serialize = function serialize() {
    // handle privacyGroupId and privateFor
    const arr = self.raw.slice();

    if (self.raw[10][0].length !== 0 && self.raw[11].length === 32) {
      throw Error(
        "privacyGroupId and privateFor fields are mutually exclusive"
      );
    }

    if (self.raw[11].length === 32) {
      arr.splice(10, 1);
    } else {
      arr.splice(11, 1);
    }

    return rlp.encode(arr);
  };

  fields.forEach(function(field, i) {
    self._fields.push(field.name);
    function getter() {
      return self.raw[i];
    }
    function setter(v) {
      // handle array of Buffer
      if (field.bufferArray) {
        v = v.map(toBuffer);
      } else {
        v = toBuffer(v);
      }

      if (v.toString("hex") === "00" && !field.allowZero) {
        v = Buffer.allocUnsafe(0);
      }

      if (field.allowLess && field.length) {
        v = ethUtils.stripZeros(v);
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
      data = Buffer.from(ethUtils.stripHexPrefix(data), "hex");
    }

    if (Buffer.isBuffer(data)) {
      data = rlp.decode(data);
    }

    if (Array.isArray(data)) {
      // handle array elements
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
        // handle array of Buffer
        let v;
        if (fields[i].bufferArray) {
          v = d.map(toBuffer);
        } else {
          v = toBuffer(d);
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
}

module.exports = {
  ...ethUtils,
  toBuffer,
  defineProperties
};
