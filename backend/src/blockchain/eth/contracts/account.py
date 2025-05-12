from hexbytes import HexBytes
from web3 import AsyncWeb3

from .abis.account import abi as account_factory_abi
from .absctract.contracts import AsyncContract
from ..utils.web3_extentions import build_tx, sign_txn_and_send


class SimpleAccount(AsyncContract):
    def __init__(
        self,
        w3: AsyncWeb3,
        address: str,
        abi: str = account_factory_abi,
        chain_id: int = None
    ):
        super().__init__(w3, address, abi, chain_id)

    async def execute(
        self,
        dest: str,
        value: int,
        func: bytes,
        signature: bytes,
        private_key: str,
    ) -> HexBytes:
        account = self._w3.eth.account.from_key(private_key)
        tx = await build_tx(
            w3=self._w3,
            from_address=account.address,
            gas=1000000,
            chain_id=self.chain_id,
        )
        transaction_made = await self._functions.execute(
            self._w3.to_checksum_address(dest),
            value, func, signature
        ).build_transaction(tx)

        send_tx = await sign_txn_and_send(
            w3=self._w3,
            transaction=transaction_made,
            private_key=account.key,
        )
        return send_tx
