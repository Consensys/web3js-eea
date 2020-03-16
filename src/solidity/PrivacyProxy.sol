pragma solidity ^0.5.12;

import "./PrivacyInterface.sol";

contract PrivacyProxy is PrivacyInterface {

  address public implementation;

  constructor(address _implementation) public {
    implementation = _implementation;
  }

  function upgradeTo(address _newImplementation) external {
    require(implementation != _newImplementation);
    _setImplementation(_newImplementation);
  }

  function _setImplementation(address _newImp) internal {
    implementation = _newImp;
  }

  function addParticipants(bytes32 enclaveKey, bytes32[] memory participants) public returns (bool) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.addParticipants(enclaveKey, participants);
  }

  function getParticipants(bytes32 enclaveKey) view public returns (bytes32[] memory) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.getParticipants(enclaveKey);
  }

  function removeParticipant(bytes32 enclaveKey, bytes32 account) public returns (bool) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.removeParticipant(enclaveKey, account);
  }

  function lock() public {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.lock();
  }

  function unlock() public {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.unlock();
  }

  function canExecute() public view returns (bool) {
    PrivacyInterface privacyInterface = PrivacyInterface(implementation);
    return privacyInterface.canExecute();
  }
}
