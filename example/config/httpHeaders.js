const Web3 = require("web3");
const EEAClient = require("../../src");

// Define an HTTP provider, passing in the desired options:
// from https://github.com/ethereum/web3.js/tree/1.x/packages/web3-providers-http
//  var options = {
//    keepAlive: true,
//    timeout: 20000, // milliseconds,
//    headers: [{name: 'Access-Control-Allow-Origin', value: '*'},{...}],
//    withCredentials: false,
//    agent: {http: http.Agent(...), baseUrl: ''}
//  };
const providerOptions = {
  headers: [{ name: "X-My-Custom-Header", value: "some value" }]
};
const httpProvider = new Web3.providers.HttpProvider(
  "http://localhost:20000",
  providerOptions
);
const web3Http = new EEAClient(new Web3(httpProvider), 2018);

web3Http.eth
  .getBlockNumber()
  .then(num => {
    console.log("Current block:", num);
    return num;
  })
  .catch(console.error);
