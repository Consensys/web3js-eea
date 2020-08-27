pragma solidity ^0.5.12;

import "./PrivacyInterface.sol";

contract PrivacyProxy is PrivacyInterface {

  address public implementation;

  constructor(address _implementation) public {
    implementation = _implementation;
  }

  function _setImplementation(address _newImp) internal {
    implementation = _newImp;
  }

  function addParticipants(bytes32[] memory _publicEnclaveKeys) public override returns (bool) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.addParticipants(_publicEnclaveKeys);
  }

  function getParticipants() view public override returns (bytes32[] memory) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.getParticipants();
  }

  function removeParticipant(bytes32 _member) public override returns (bool) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    bool result = privacyInterface.removeParticipant(_member);
    if (result) {
      emit ParticipantRemoved(_member);
    }
    return result;
  }

  function lock() public override {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.lock();
  }

  function unlock() public override {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.unlock();
  }

  function canExecute() public override view returns (bool) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.canExecute();
  }

  function getVersion() public override view returns (bytes32) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.getVersion();
  }

  function canUpgrade() external override returns (bool) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.canUpgrade();
  }

  function upgradeTo(address _newImplementation) external {
    require(this.canExecute(), "The contract is locked.");
    require(implementation != _newImplementation, "The contract to upgrade to has to be different from the current management contract.");
    require(this.canUpgrade(), "Not allowed to upgrade the management contract.");
    bytes32[] memory participants = this.getParticipants();
    _setImplementation(_newImplementation);
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    privacyInterface.addParticipants(participants);
  }

  event ParticipantRemoved(
    bytes32 publicEnclaveKey
  );
}
