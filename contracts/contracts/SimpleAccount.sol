// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.24;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

function itoa(uint value) pure returns (string memory) {
    uint length = 1;
    uint v = value;
    while ((v /= 10) != 0) {
        length++;
    }

    // Allocated enough bytes
    bytes memory result = new bytes(length);

    // Place each ASCII string character in the string,
    // right to left
    while (true) {
        length--;

        // The ASCII value of the modulo 10 value
        result[length] = bytes1(uint8(0x30 + (value % 10)));

        value /= 10;

        if (length == 0) {
            break;
        }
    }

    return string(result);
}

contract SimpleAccount is UUPSUpgradeable, Initializable {
    address public signer;
    address public recovery_signer;

    constructor() {
        _disableInitializers();
    }

    function _onlyRecoverySigner() internal view {
        require(msg.sender == recovery_signer, "only recovery signer");
    }

    function execute(address dest, uint256 value, bytes calldata func, bytes calldata signature) external {
        require(recoverSigner(keccak256(abi.encodePacked(dest, value, func)), signature) == signer, "invalid signature");
        (bool success, bytes memory result) = dest.call{value: value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function changeSigner(address _new_signer, bytes calldata signature) external {
        require(recoverSigner(keccak256(abi.encodePacked(_new_signer)), signature) == recovery_signer, "invalid signature");
        signer = _new_signer;
    }

    function initialize(
        address _signer,
        address _recoverySigner
    ) public virtual initializer {
        signer = _signer;
        recovery_signer = _recoverySigner;
    }

    function recoverSigner(bytes32 message, bytes memory sig) public pure returns (address) {
        // Sanity check before using assembly
        require(sig.length == 65, "invalid signature");

        // Decompose the raw signature into r, s and v (note the order)
        uint8 v;
        bytes32 r;
        bytes32 s;

        assembly {
            /*
            First 32 bytes stores the length of the signature

            add(sig, 32) = pointer of sig + 32
            effectively, skips first 32 bytes of signature

            mload(p) loads next 32 bytes starting at the memory address p into memory
            */

            // first 32 bytes, after the length prefix
            r := mload(add(sig, 32))
            // second 32 bytes
            s := mload(add(sig, 64))
            // final byte (first byte of the next 32 bytes)
            v := byte(0, mload(add(sig, 96)))
        }

        return _ecrecover(message, v, r, s);
    }

    function _ecrecover(bytes32 message, uint8 v, bytes32 r, bytes32 s) internal pure returns (address) {
        // Compute the EIP-191 prefixed message
        bytes memory prefixedMessage = abi.encodePacked(
            "\x19Ethereum Signed Message:\n",
            itoa(message.length),
            message
        );

        // Compute the message digest
        bytes32 digest = keccak256(prefixedMessage);

        // Use the native ecrecover provided by the EVM
        return ecrecover(digest, v, r, s);
    }

    function _authorizeUpgrade(address newImplementation) internal view override {
        (newImplementation);
        require(msg.sender == recovery_signer, "only recovery signer");
    }
    
    receive() payable external {}
}