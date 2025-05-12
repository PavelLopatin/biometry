from eth_typing import ChecksumAddress
from web3 import AsyncWeb3


class AsyncContract(object):
    def __init__(
        self,
        w3: AsyncWeb3,
        address: str,
        abi: str,
        chain_id: int = None,
    ):
        self._w3: AsyncWeb3 = w3
        self.address: ChecksumAddress = w3.to_checksum_address(address)
        self._contract = w3.eth.contract(self.address, abi=abi)
        self._functions = self._contract.functions
        self.chain_id = chain_id
