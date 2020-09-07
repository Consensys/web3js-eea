/*
 * Copyright ConsenSys Software Inc.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. 
 * If a copy of the MPL was not distributed with this file, You can obtain one at 
 *
 * http://mozilla.org/MPL/2.0/
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 *
 * SPDX-License-Identifier: MPL-2.0
 */
pragma solidity ^0.6.0;
interface PrivacyInterface {

  function addParticipants(bytes32[] calldata publicEnclaveKeys) external returns (bool);

  function removeParticipant(bytes32 participant) external returns (bool);

  function getParticipants() external view returns (bytes32[] memory);

  function lock() external;

  function unlock() external;

  function canExecute() external view returns (bool);

  function getVersion() external view returns (bytes32);

  function canUpgrade() external returns (bool);
}