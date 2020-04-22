const Web3 = require("web3");
const EEAClient = require("../../src");

// Define a WebSocket provider, passing in the desired options:
// See https://github.com/ethereum/web3.js/tree/1.x/packages/web3-providers-ws for options
const providerOptions = {
  timeout: 30000, // ms
  headers: {
    authorization: "Basic username:password"
  },
  reconnect: {
    auto: true,
    delay: 5000, // ms
    maxAttempts: 5,
    onTimeout: false
  }
};

const websocketProvider = new Web3.providers.WebsocketProvider(
  "http://localhost:8546",
  providerOptions
);

const web3Ws = new EEAClient(new Web3(websocketProvider), 2018);

web3Ws.eth
  .getBlockNumber()
  .then(num => {
    console.log("Current block:", num);
    return num;
  })
  .then(() => {
    console.log("disconnecting...");
    return web3Ws.currentProvider.disconnect();
  })
  .catch(console.error);
