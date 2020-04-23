/* eslint-disable no-underscore-dangle */

/**
 * Interacts with a private contract
 * @param {EEAClient} client
 * @param {Contract} contract
 * @param {String} address
 * @param {object} options
 */
function PrivateContract(client, contract, address, options) {
  this.client = client;
  this.contract = contract;
  this.address = address;

  // extract options
  this.privacyOptions = options.privacyOptions;
  this.privateKey = options.privateKey;
  this.enclaveKey = options.enclaveKey;
  this.deployReceipt = options.deployReceipt;

  return this;
}

/**
 * Send a private transaction
 */
PrivateContract.prototype.send = async function send(method, params) {
  const data = this.contract.methods[method](params).encodeABI();

  return this.client.eea
    .sendRawTransaction({
      to: this.address,
      data,
      privateFrom: this.privacyOptions.enclaveKey,
      privacyGroupId: this.privacyOptions.privacyGroupId,
      privateKey: this.privateKey
    })
    .then(transactionHash => {
      return this.client.priv.getTransactionReceipt(
        transactionHash,
        this.enclaveKey
      );
    });
};

/**
 * Creates private contracts
 * @param {*} bytecode
 * @param {*} jsonInterface
 */
function ContractFactory(bytecode, jsonInterface) {
  this.bytecode = bytecode;
  this.jsonInterface = jsonInterface;
  this.deployedTx = undefined;
  this.client = undefined;
  this.privacyOptions = {};
  this.contract = undefined;

  return this;
}

/**
 * Connect to a client and set credentials for transactions
 */
ContractFactory.prototype.connect = async function connect(
  client,
  privacyOptions,
  privateKey
) {
  this.client = client;
  this.privacyOptions = privacyOptions;
  this.privateKey = privateKey;
  this.contract = new this.client.eth.Contract(this.jsonInterface);
};

ContractFactory.prototype._checkConnection = function _checkConnection() {
  if (this.client == null || this.privateKey == null) {
    throw new Error("Must connect to a client first");
  }
};

/**
 * Deploy a private contract to a privacy group
 */
ContractFactory.prototype.privateDeploy = async function privateDeploy(
  privacyGroupId
) {
  this._checkConnection();

  const receipt = await this.client.eea
    .sendRawTransaction({
      data: `0x${this.bytecode}`,
      privateFrom: this.privacyOptions.enclaveKey,
      privacyGroupId,
      privateKey: this.privateKey
    })
    .then(hash => {
      return this.client.priv.getTransactionReceipt(hash, this.enclaveKey);
    });
  this.deployedTx = receipt;

  // Create a new contract with the current options
  const contractOptions = {
    privacyOptions: this.privacyOptions,
    privateKey: this.privateKey,
    deployReceipt: receipt
  };

  return new PrivateContract(
    this.client,
    new this.client.eth.Contract(this.jsonInterface),
    receipt.contractAddress,
    contractOptions
  );
};

module.exports = { ContractFactory };
