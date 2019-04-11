const Web3 = require('web3');
const EEAClient = require('../src');
const EventEmitter = require('./EventEmitter.json');

const web3 = new EEAClient(new Web3('http://localhost:20000'), 2018);

// pass by reference monkey patch
// gives us `signature` field on abi items
const contract = web3.eth.Contract(EventEmitter.abi);

const contractOptions = {
    data: '0x' + EventEmitter.binary,
    privateFrom: 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=',
    privateFor: ['Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs='],
    privateKey: '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63'
};

web3.eea.sendRawTransaction(contractOptions).then(res => {
    console.log("Transaction Hash " + res.data.result);
    return web3.eea.getTransactionReceipt(res.data.result, 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=')
}).then(privateTransactionReceipt => {
    console.log("Private Transaction Receipt");
    console.log(privateTransactionReceipt.data)
    return privateTransactionReceipt.data.result.contractAddress
}).then(contractAddress => {
    // can we do a web3.eea.Contract? somehow need to override to use the eea.sendRawTransaction when invoking contract methods
    // const contract = web3.eth.Contract(HumandStandartTokenJson.abi, contractAddress);
    // contract.methods.transfer(["to", "value"]).send(??)

    // already 0x prefixed
    const functionAbi = EventEmitter.abi.find(function (element) {
        return element.name === 'store'
    });
    const functionArgs = web3.eth.abi.encodeParameters(functionAbi.inputs, [1000]).slice(2);

    web3.eea.sendRawTransaction({
        to: contractAddress,
        data: functionAbi.signature + functionArgs,
        privateFrom: 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=',
        privateFor: ['Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs='],
        privateKey: '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63'
    }).then(res => {
        console.log("Transaction Hash " + res.data.result);
        return web3.eea.getTransactionReceipt(res.data.result, 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=')
    }).then(privateTransactionReceipt => {
        console.log("Private Transaction Receipt");
        console.log(privateTransactionReceipt.data)
        if (privateTransactionReceipt.data.result.logs.length > 0) {
            console.log("Log 0");
            console.log(privateTransactionReceipt.data.result.logs[0])
        }
        return privateTransactionReceipt.data.result.to
    }).then(contractAddress => {

        // already 0x prefixed
        const functionAbi = EventEmitter.abi.find(function (element) {
            return element.name === 'value'
        });
        web3.eea.sendRawTransaction({
            to: contractAddress,
            data: functionAbi.signature,
            privateFrom: 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=',
            privateFor: ['Ko2bVqD+nNlNYL5EE7y3IdOnviftjiizpjRt+HTuFBs='],
            privateKey: '8f2a55949038a9610f50fb23b5883af3b4ecb3c3bb792cbcefbd1542c692be63'
        }).then(res => {
            console.log("Transaction Hash " + res.data.result);
            return web3.eea.getTransactionReceipt(res.data.result, 'A1aVtMxLCUHmBVHXoZzzBgPbW/wj5axDpW9X8l91SGo=')
        }).then(privateTransactionReceipt => {
            console.log("Private Transaction Receipt");
            console.log(privateTransactionReceipt.data.result);
        });
    });
});