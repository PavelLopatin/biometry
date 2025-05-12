// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/utils/Create2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./SimpleAccount.sol";


struct UserContract {
    address signer;
    address recovery_signer;
    address contract_address;
}

contract SimpleAccountFactory {
    SimpleAccount public immutable accountImplementation;
    uint256 public counter;

    event AccountInitialized(uint256 _id, address indexed signer, address indexed recovery_signer);

    mapping(uint256 => UserContract) public contracts;
    mapping(address => uint256) public contracts_ids;
    mapping(address => uint256) public contracts_signers;
    constructor() {
        accountImplementation = new SimpleAccount();
    }

    function getContract(uint256 _id) external view returns (UserContract memory) {
        return contracts[_id];
    }

    function createAccount(
        address _signer,
        address _recovery_signer
    ) public returns (SimpleAccount) {
        address contract_address = getAddress(_signer, _recovery_signer, counter);
        emit AccountInitialized(counter, _signer, _recovery_signer);
        contracts[counter] = UserContract(_signer, _recovery_signer, contract_address);
        contracts_ids[contract_address] = counter;
        contracts_signers[_signer] = counter;
        address payable proxyAddr = payable(address(
            new ERC1967Proxy{salt : bytes32(counter)}(
                address(accountImplementation),
                abi.encodeCall(SimpleAccount.initialize, (_signer, _recovery_signer))
            )
        ));
        SimpleAccount simple_account = SimpleAccount(proxyAddr);
        counter++;
        return simple_account;
    }
    
    function getUserByContract(address _contract) public view returns (UserContract memory) {
        return contracts[contracts_ids[_contract]];
    }

    function getUserBySigner(address _signer) public view returns (UserContract memory) {
        return contracts[contracts_signers[_signer]];
    }

    function getAddress(
        address _signer,
        address _recovery_signer,
        uint256 _id
    ) public view returns (address) {
        return Create2.computeAddress(
            bytes32(_id), 
            keccak256(
                abi.encodePacked(
                    type(ERC1967Proxy).creationCode,
                    abi.encode(
                        address(accountImplementation),
                        abi.encodeCall(SimpleAccount.initialize, (_signer, _recovery_signer))
                    )
                )
            )
        );
    }
}
