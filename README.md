# web3.js-eea Client Library

JavaScript libraries to:
 
* Create and send private transactions 
* Create, delete, and find privacy groups

## Issues 

web3.js-eea issues are tracked in [GitHub](https://github.com/PegaSysEng/web3js-eea/issues). 
See our [contribution guidelines](https://github.com/PegaSysEng/web3js-eea/blob/master/CONTRIBUTING.md) for more detail on searching and creating issues.

## Using 

The Besu documentation describes how to [use the web3.js-eea libraries](https://besu.hyperledger.org/en/stable/HowTo/Interact/Client-Libraries/web3js-eea/). 

## Compatibility Matrix

These libraries have been tested with the following versions of Besu and Orion
Besu version | Orion version | web3js-eea version
| ------------------- | ---------------------------- | ---------------------------- |
1.5.3 | 1.6 | 0.10.0
1.5.2 | 1.6 | 0.9.0
1.5.1 | 1.6 | 0.9.0


## Developing

Note that the tests rely on the values in example/keys.js, so revert or stash any local changes to that file before running the tests.
To run all the tests:
```bash
$ npm test
```
- Decode the transaction checking each field;
    1. Nonce
    2. GasPrice
    3. GasLimit
    4. To
    5. Value
    6. Data
    7. V
    8. R
    9. S
    10. PrivateFrom
    11. PrivateFor
    12. Restriction
- Decode the RLP;
- Serialize the Transaction;
- Sign the Transaction;
- Get the sender's address after signing the Transaction;
- Get the sender's public key after signing the Transaction;

Sample Output
```bash
> npm test

> eeajs@1.0.0 test /home/vstevam/eeajs/eeajs-fork/eeajs
> tape test/**/*.js

TAP version 13
# [Transaction]: Basic functions
# should decode transactions
ok 1 should be equal
ok 2 should be equal
ok 3 should be equal
ok 4 should be equal
ok 5 should be equal
ok 6 should be equal
ok 7 should be equal
ok 8 should be equal
ok 9 should be equal
ok 10 should be equal
ok 11 should be equal
ok 12 should be equal
# should decode rlp
ok 13 should be equivalent
# should serialize
ok 14 should be equivalent
# should sign tx
# should get sender's address after signing it
ok 15 should be equal
# should get sender's public key after signing it
ok 16 should be equal
(node:7900) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.

1..16
# tests 16
# pass  16

# ok
```

