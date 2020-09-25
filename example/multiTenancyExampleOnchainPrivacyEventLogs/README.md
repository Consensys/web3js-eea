# Examples of getting event logs

Scripts:
- `setup.js` - create privacy group and deploy contract
- `subscribe.js` - subscribe to new logs sent to the contract using the HTTP polling API
- `subscribeWebSocket.js` - subscribe to new logs sent to the contract using the WebSocket pub-sub API
- `sendTransaction.js` - send a transaction to update the value in the contract
- `getPastLogs.js` - get past logs

## Usage
Run `setup.js` to create a new privacy group and deploy an [EventEmitter](../solidity/EventEmitter/EventEmitter.sol) contract into it. The privacy group ID and the contract address will be saved in `params.json` to be used by the other scripts.

Next, run `subscribe.js` or `subscribeWebSockets.js` to subscribe to logs for the contract. The script will print any past and incoming logs until exited.

Run `sendTransaction.js` to update the value stored in the contract and emit a log. You can specify the value to store as a command line argument.
```
node sendTransaction.js 5
```

Each time you run the script, you should see a new log output from `subscribe.js`/`subscribeWebSocket.js`.

Finally, run `getPastLogs.js` for all of the logs sent to the contract.

## flexible privacy groups
To test behavior when adding and removing users from flexible privacy groups, additional scripts are provided.
Once you have verified that logs are received with subscribe/subscribeWebSockets and sendTransaction as above, run `removeParticipantFromGroup.js` and you will see the subscription revoked. In besu logs you will see "Error processing JSON-RPC requestBody
org.hyperledger.besu.ethereum.privacy.MultiTenancyValidationException: Privacy group must contain the enclave public key"
run sendTransaction now and you won't see any logs
then run `addParticipantToGroup.js` and you will see access reinstated, including logs that were sent while user was not a member of the group.
