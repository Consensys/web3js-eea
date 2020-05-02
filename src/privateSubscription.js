const EventEmitter = require("events");

function PrivateSubscription(web3, privacyGroupId, filter) {
  this.privacyGroupId = privacyGroupId;
  this.filter = filter;

  this.web3 = web3;
  this.filterId = null;

  this.timer = undefined;
  this.getPast = false;

  return this;
}

// get functions from EventEmitter
PrivateSubscription.prototype = Object.create(EventEmitter.prototype);

PrivateSubscription.prototype.subscribe = async function subscribe() {
  // install filter
  this.filterId = await this.web3.priv.createFilter(
    this.privacyGroupId,
    this.filter,
    this.blockId
  );

  // If `fromBlock` is set, get previous logs when the user adds
  // a callback for the "data" event.
  if (this.filter.fromBlock != null) {
    this.getPast = true;
  }

  // wait for new logs
  await this.pollForLogs();

  return this.filterId;
};

PrivateSubscription.prototype.on = async function on(eventName, callback) {
  // Register the callback
  EventEmitter.prototype.on.call(this, eventName, callback);

  // Get past logs if necessary once the user has added a callback
  if (this.getPast && eventName === "data") {
    const pastLogs = await this.web3.priv.getFilterLogs(
      this.privacyGroupId,
      this.filterId
    );
    pastLogs.forEach(log => {
      this.emit("data", log);
    });
  }
};

PrivateSubscription.prototype.pollForLogs = async function pollForLogs(
  ms = 1000
) {
  const fetchLogs = async () => {
    try {
      const logs = await this.web3.priv.getFilterChanges(
        this.privacyGroupId,
        this.filterId
      );
      logs.forEach(log => {
        this.emit("data", log);
      });
      // continue
      this.timeout = setTimeout(() => {
        this.pollForLogs(ms);
      }, ms);
    } catch (error) {
      this.emit("error", error);
    }
  };

  fetchLogs();
};

PrivateSubscription.prototype.unsubscribe = async function unsubscribe(
  callback
) {
  const id = this.filterId;

  return this.web3.priv
    .uninstallFilter(this.privacyGroupId, this.filterId)
    .then(() => {
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }

      this.removeAllListeners();
      if (callback != null) {
        callback(true);
      }
      return id;
    })
    .catch(error => {
      if (callback != null) {
        callback(error);
      }
    });
};

module.exports = {
  PrivateSubscription
};
