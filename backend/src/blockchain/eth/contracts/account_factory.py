from eth_typing import ChecksumAddress
from hexbytes import HexBytes
from web3 import AsyncWeb3

from .abis.account_factory import abi as account_factory_abi
from .absctract.contracts import AsyncContract
from ..utils.web3_extentions import build_tx, sign_txn_and_send


class SympleAccountFactory(AsyncContract):
    def __init__(
        self,
        w3: AsyncWeb3,
        address: str,
        abi: str = account_factory_abi,
        chain_id: int = None
    ):
        super().__init__(w3, address, abi, chain_id)

    async def create_account(
        self,
        signer: str,
        recovery_signer: str,
        private_key: str,
    ) -> HexBytes:
        account = self._w3.eth.account.from_key(private_key)
        tx = await build_tx(
            w3=self._w3,
            from_address=account.address,
            gas=1000000,
            chain_id=self.chain_id,
        )
        transaction_made = await self._functions.createAccount(
            self._w3.to_checksum_address(signer),
            self._w3.to_checksum_address(recovery_signer)
        ).build_transaction(tx)

        send_tx = await sign_txn_and_send(
            w3=self._w3,
            transaction=transaction_made,
            private_key=account.key,
        )
        return send_tx

    async def get_user_by_contract(self, contract: str) -> ChecksumAddress:
        return await self._functions.getUserByContract(
            self._w3.to_checksum_address(contract)
        ).call()

    async def get_user_by_signer(self, signer: str) -> tuple[ChecksumAddress, ChecksumAddress, ChecksumAddress]:
        return await self._functions.getUserBySigner(
            self._w3.to_checksum_address(signer)
        ).call()


    async def get_address(
        self,
        signer: str,
        recovery_signer: str,
        counter: int
    ):
        return await self._functions.getAddress(
            self._w3.to_checksum_address(signer),
            self._w3.to_checksum_address(recovery_signer),
            counter
        ).call()
