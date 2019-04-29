# EEA JavaScript libraries - EEAJS

EEA JavaScript libraries including examples to:

* Interact with the Pantheon Private Network Quickstart to deploy a contract and send private transactions.
  Using the EEAJS library with the Private Network Quickstart is described below. 
  
* Deploy a contract and send private transactions in your own private network. Using the EEAJS library
with your own network is described in the [Pantheon documentation](https://docs.pantheon.pegasys.tech/en/latest/Privacy/Creating-Sending-Private-Transactions/). 


## Prerequisites

To run this tutorial, you must have the following installed:

- [Docker and Docker-compose](https://docs.docker.com/compose/install/) 

- [Git command line](https://git-scm.com/)

- MacOS or Linux 
    
        **Important** 
        The Private Network Quickstart is not supported on Windows. If using Windows, run the quickstart
        inside a Linux VM such as Ubuntu. 

- [Nodejs](https://nodejs.org/en/download/)

## Clone Pantheon Quickstart 

Clone the **pantheon-quickstart* repository: 

```
git clone https://github.com/PegaSysEng/pantheon-quickstart.git
```

## Start Privacy Private Network Quickstart  

Go to the `pantheon-quickstart/privacy` directory and start the network: 

```
./run.sh
```

## Deploy Contracts

Clone the **eeajs** repository:

```bash
git clone https://github.com/PegaSysEng/eeajs.git
```

Go to the `eeajs` directory and install the dependencies:

```bash
cd eeajs/
npm install
```

Deploy the `EventEmitter` contract:
```bash
node example/eventEmitter.js
```
The contract sets a value of `1000` and retrieves the value.

Sample Output
```bash
Transaction Hash 0x9673cb3eebd6cf0139921c74c154bb1eb91c7d3c935362eb19dbda76a40bbfce
Waiting ...
Private Transaction Receipt
{ jsonrpc: '2.0',
  id: 1,
  result:
   { contractAddress: '0x5bd6dee320c5407682fba7954ae53e16ee4f4794',
     from: '0xfe3b557e8fb62b89f4916b721be55ceb828dbd73',
     to: null,
     output:
      '0x6080604052600436106100565763ffffffff7c01000000000000000000000000000000000000000000000000000000006000350416633fa4f245811461005b5780636057361d1461008257806367e404ce146100ae575b600080fd5b34801561006757600080fd5b506100706100ec565b60408051918252519081900360200190f35b34801561008e57600080fd5b506100ac600480360360208110156100a557600080fd5b50356100f2565b005b3480156100ba57600080fd5b506100c3610151565b6040805173ffffffffffffffffffffffffffffffffffffffff9092168252519081900360200190f35b60025490565b604080513381526020810183905281517fc9db20adedc6cf2b5d25252b101ab03e124902a73fcb12b753f3d1aaa2d8f9f5929181900390910190a16002556001805473ffffffffffffffffffffffffffffffffffffffff191633179055565b60015473ffffffffffffffffffffffffffffffffffffffff169056fea165627a7a72305820c7f729cb24e05c221f5aa913700793994656f233fe2ce3b9fd9a505ea17e8d8a0029',
     logs: [] } }
Transaction Hash 0x8216dd013e7fead50443a878dad6d9d66e623a5ced5632725570e6fd21651b34
Waiting ...
Private Transaction Receipt
{ jsonrpc: '2.0',
  id: 1,
  result:
   { contractAddress: null,
     from: '0xfe3b557e8fb62b89f4916b721be55ceb828db d73',
     to: '0x5bd6dee320c5407682fba7954ae53e16ee4f479 4',
     output: '0x', 
     logs: [ [Object] ] } } 
Log 0
{ address: '0x5bd6dee320c5407682fba7954ae53e16ee4f4794',
  topics:
   [ '0xc9db20adedc6cf2b5d25252b101ab03e124902a73fcb12b753f3d1aaa2d8f9f5' ],
  data:
   '0x000000000000000000000000fe3b557e8fb62b89f4916b721be55ceb828dbd7300000000000000000000000000000000000000000000000000000000000003e8',
  blockNumber: '0x6f58',
  transactionHash:
   '0x8216dd013e7fead50443a878dad6d9d66e623a5ced5632725570e6fd21651b34',
  transactionIndex: '0x0',
  blockHash:
   '0xafd1a4192a8b8c265c163f3c79033efa68a01c36a207fbc89c1d9791d48582b2',
  logIndex: '0x0',
  removed: false }
Transaction Hash 0xe5f1c0c61654d54afde262364c180a1bb444f1f4b994e7ec39ddf7fa6afd5d41
Waiting ...
Private Transaction Receipt
{ contractAddress: null,
  from: '0xfe3b557e8fb62b89f4916b721be55ceb828dbd73',
  to: '0x5bd6dee320c5407682fba7954ae53e16ee4f4794',
  output:
   '0x00000000000000000000000000000000000000000000000000000000000003e8',
  logs: [] }
```

`erc20.js` deploys a `HumanStandardToken` contract and transfers 1 token to node2.

```bash
$ node example/erc20.js
```

Sample Output
```bash
Transaction Hash 0xbaca8bb4b7d4a087a12511e01ba685a642337a2eddfea2fc0aaaaeb6b6f996bd
Waiting ...Private Transaction Receipt{ jsonrpc: '2.0',  id: 1,  result:   { contractAddress: '0xdaa74d5ab2e0b0fad11fca33a76b27c4092f90db',     from: '0xfe3b557e8fb62b89f4916b721be55ceb828dbd73',     to: null,     output:      '0x6080604052600436106100955763ffffffff60e060020a60003504166306fdde0381146100a7578063095ea7b31461013157806318160ddd1461016957806323b872dd14610190578063313ce567146101ba57806354fd4d50146101e557806370a08231146101fa57806395d89b411461021b578063a9059cbb14610230578063cae9ca5114610254578063dd62ed3e146102bd575b3480156100a157600080fd5b50600080fd5b3480156100b357600080fd5b506100bc6102e4565b6040805160208082528351818301528351919283929083019185019080838360005b838110156100f65781810151838201526020016100de565b50505050905090810190601f1680156101235780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561013d57600080fd5b50610155600160a060020a0360043516602435610372565b604080519115158252519081900360200190f35b34801561017557600080fd5b5061017e6103d9565b60408051918252519081900360200190f35b34801561019c57600080fd5b50610155600160a060020a03600435811690602435166044356103df565b3480156101c657600080fd5b506101cf6104cc565b6040805160ff9092168252519081900360200190f35b3480156101f157600080fd5b506100bc6104d5565b34801561020657600080fd5b5061017e600160a060020a0360043516610530565b34801561022757600080fd5b506100bc61054b565b34801561023c57600080fd5b50610155600160a060020a03600435166024356105a6565b34801561026057600080fd5b50604080516020600460443581810135601f8101849004840285018401909552848452610155948235600160a060020a031694602480359536959460649492019190819084018382808284375094975061063f9650505050505050565b3480156102c957600080fd5b5061017e600160a060020a03600435811690602435166107da565b6003805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561036a5780601f1061033f5761010080835404028352916020019161036a565b820191906000526020600020905b81548152906001019060200180831161034d57829003601f168201915b505050505081565b336000818152600260209081526040808320600160a060020a038716808552908352818420869055815186815291519394909390927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925928290030190a35060015b92915050565b60005481565b600160a060020a038316600090815260016020526040812054821180159061042a5750600160a060020a03841660009081526002602090815260408083203384529091529020548211155b80156104365750600082115b156104c157600160a060020a03808416600081815260016020908152604080832080548801905593881
680835284832080548890039055600282528483203384528252918490208054879003905583518681529351929391927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef9281900390910190a35060016104c5565b5060005b9392505050565b60045460ff1681565b6006805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561036a5780601f1061033f
5761010080835404028352916020019161036a565b600160a060020a031660009081526001602052604090205490565b6005805460408051602060026001851615610100026000190190941693909304601f8101849004840282018401909252818152929183018282801561036a5780601f1061033f5761010080835404028352916020019161036a565b3360009081526001602052604081205482118015906105c55750600082115b15610637573360008181526001602090815
2604080832080548790039055600160a060020a03871680845292819020805487019055805186815290519293927fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef929181900390910190a35060016103d3565b5060006103d3565b336000818152600260209081526040808320600160a060020a038816808552908352818420879055815187815291519394909390927f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7
c3b925928290030190a383600160a060020a031660405180807f72656365697665417070726f76616c28616464726573732c75696e743235362c81526020017f616464726573732c627974657329000000000000000000000000000000000000815250602e019050604051809103902060e060020a9004338530866040518563ffffffff1660e060020a0281526004018085600160a060020a0316600160a060020a0316815260200184815260200183600160a060020a031660016
0a060020a03168152602001828051906020019080838360005b8381101561077f578181015183820152602001610767565b50505050905090810190601f1680156107ac5780820380516001836020036101000a031916815260200191505b509450505050506000604051808303816000875af19250505015156107d057600080fd5b5060019392505050565b600160a060020a039182166000908152600260209081526040808320939094168252919091522054905600a165627a
7a723058209b91615f1fff80b3faf6dfeb338f6d0a95bb9a1e4de0bdb0b349c07c2f6371bc0029',
     logs: [] } }
Transaction Hash 0xd327ba43c044b2e0dc9edf583eed4e81f334d890ba5d4f64733b86cb6aadc7fc
Waiting ...
Private Transaction Receipt
{ contractAddress: null,
  from: '0xfe3b557e8fb62b89f4916b721be55ceb828dbd73',
  to: '0xdaa74d5ab2e0b0fad11fca33a76b27c4092f90db',
  output:
   '0x0000000000000000000000000000000000000000000000000000000000000001',
  logs:
   [ { address: '0xdaa74d5ab2e0b0fad11fca33a76b27c4092f90db',
       topics: [Array],
       data:
        '0x0000000000000000000000000000000000000000000000000000000000000001',
       blockNumber: '0x7016',
       transactionHash:
        '0xd327ba43c044b2e0dc9edf583eed4e81f334d890ba5d4f64733b86cb6aadc7fc',
       transactionIndex: '0x0',
       blockHash:
        '0x7345af897aa578d76974ae96715ca39facb8466f11cd4ea32927705533759d14',
       logIndex: '0x0',
       removed: false } ] }
Log 0
{ address: '0xdaa74d5ab2e0b0fad11fca33a76b27c4092f90db',
  topics:
   [ '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
     '0x000000000000000000000000fe3b557e8fb62b89f4916b721be55ceb828dbd73',
     '0x000000000000000000000000627306090abab3a6e1400e9345bc60c78a8bef57' ],
  data:
   '0x0000000000000000000000000000000000000000000000000000000000000001',
  blockNumber: '0x7016',
  transactionHash:
   '0xd327ba43c044b2e0dc9edf583eed4e81f334d890ba5d4f64733b86cb6aadc7fc',
  transactionIndex: '0x0',
  blockHash:
   '0x7345af897aa578d76974ae96715ca39facb8466f11cd4ea32927705533759d14',
  logIndex: '0x0',
  removed: false }
  ```

## Multinode Example

The examle provides a simple interaction with Pantheon nodes created in [Pantheon-Quickstart](https://github.com/PegaSysEng/pantheon-quickstart).

1. Deploy `EventEmitter` contract.

data - Binary of the contract
privateFrom - public Orion key (Node1)
privateFor -  public Orion key (Node2)
privateKey - Pantheon private key (Node1), to sign the contract.

```bash
$ node example/contractCreation.js
```

2. Get the contract address from the Private Transaction Receipt and set the contract hash into a variable.
```bash
$ export CONTRACT_ADDRESS=0xdaa74d5ab2e0b0fad11fca33a76b27c4092f90db
```

3. Store the value from `node1`.
```bash
$ node example/storeValueFromNode1.js
```

4. Get the value from `node2`
```bash
$ node example/getValueFromNode2.js
```

Sample Output
```bash
(node:24545) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
Transaction Hash 0x9673cb3eebd6cf0139921c74c154bb1eb91c7f3c935362eb19dbdf76a40bbfce
Waiting ...
Private Transaction Receipt
{	jsonrpc: '2.0',
	id: 1,
	result:
		{ contractAddress: null,
		from: 'Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs=',
		to: 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=',
		output:
			'0x00000000000000000000000000000000000000000000000000000000000003e8',
			logs: [] } }
```
It can be verified from the output - `0x00000000000000000000000000000000000000000000000000000000000003e8`

5. Store the value from `node2`.
```bash
$ node example/multiNodeExample/storeValueFromNode2.js
```

6. Get the value from `node1`
```bash
$ node example/multiNodeExample/getValueFromNode1.js
```

Sample Output
```bash
(node:24545) [DEP0005] DeprecationWarning: Buffer() is deprecated due to security and usability issues. Please use the Buffer.alloc(), Buffer.allocUnsafe(), or Buffer.from() methods instead.
Transaction Hash 0x9673cb3eebd6cf0139921c74c154bb1eb91c7f3c935362eb19dbdf76a40bbfce
Waiting ...
Private Transaction Receipt
{	jsonrpc: '2.0',
	id: 1,
	result:
		{ contractAddress: null,
		from: 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=',
		to: 'Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs='',
		output:
			'0x0000000000000000000000000000000000000000000000000000000000000064',
			logs: [] } }
```
It can be verified from the output - `0x0000000000000000000000000000000000000000000000000000000000000064`


## Run Tests

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