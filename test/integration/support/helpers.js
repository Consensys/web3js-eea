const fs = require("fs");
const path = require("path");

const artifactDir = path.join(__dirname, "../../../example/solidity");
const eventEmitterBytecode = fs.readFileSync(
  path.join(artifactDir, "EventEmitter/EventEmitter.bin")
);

const parseError = error => {
  const e = JSON.parse(error);
  return e.error;
};

module.exports = {
  parseError,
  contracts: {
    eventEmitter: { bytecode: eventEmitterBytecode }
  }
};
