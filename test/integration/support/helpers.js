const fs = require("fs");
const path = require("path");

const { ContractFactory } = require("./contractFactory");

const artifactDir = path.join(__dirname, "../../../example/solidity");
const eventEmitterBytecode = fs.readFileSync(
  path.join(artifactDir, "EventEmitter/EventEmitter.bin")
);

const eventEmitterArtifacts = JSON.parse(
  fs.readFileSync(path.join(artifactDir, "EventEmitter/EventEmitter.json"))
);
const eventEmitterAbi = eventEmitterArtifacts.output.abi;

const privacyArtifactDir = path.join(__dirname, "../../../src/solidity");
const privacyInterfaceAbi = JSON.parse(
  fs.readFileSync(path.join(privacyArtifactDir, "PrivacyInterface.abi"))
);
const parseError = error => {
  const prefix = "Returned error: ";
  const start = error.message.indexOf(prefix) + prefix.length;
  const msg = error.message.substr(start);
  return { message: msg };
};

module.exports = {
  parseError,
  contracts: {
    eventEmitter: { abi: eventEmitterAbi, bytecode: eventEmitterBytecode },
    privacyInterface: {
      abi: privacyInterfaceAbi,
      address: "0x000000000000000000000000000000000000007c"
    }
  },
  ContractFactory
};
