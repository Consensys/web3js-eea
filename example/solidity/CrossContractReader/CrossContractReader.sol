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
pragma solidity >=0.4.0 <0.6.0;

import "./EventEmitter.sol";

// compile with:
// solc CrossContractReader.sol --bin --abi --optimize --overwrite -o .
// then create web3j wrappers with:
// web3j solidity generate -b ./generated/CrossContractReader.bin -a ./generated/CrossContractReader.abi -o ../../../../../ -p org.hyperledger.besu.tests.web3j.generated
contract CrossContractReader {
    uint counter;

    event NewEventEmitter(
        address contractAddress
    );

    function read(address emitter_address) view public returns (uint) {
        EventEmitter em = EventEmitter(emitter_address);
        return em.value();
    }

    function deploy() public {
        EventEmitter em = new EventEmitter();
        emit NewEventEmitter(address(em));
    }

    function deployRemote(address crossAddress) public {
        CrossContractReader cross = CrossContractReader(crossAddress);
        cross.deploy();
    }

    function increment() public {
        counter++;
    }

    function incrementRemote(address crossAddress) public {
        CrossContractReader cross = CrossContractReader(crossAddress);
        cross.increment();
    }

    function destroy() public {
        selfdestruct(msg.sender);
    }

    function remoteDestroy(address crossAddress) public {
        CrossContractReader cross = CrossContractReader(crossAddress);
        cross.destroy();
    }
}