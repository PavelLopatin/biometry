from decimal import Decimal, localcontext
from typing import Union

from eth_typing import HexAddress
from eth_utils import is_string, is_integer
from eth_utils.currency import MIN_WEI, MAX_WEI
from hexbytes import HexBytes
from web3 import AsyncWeb3

from blockchain.eth.utils.web3_extentions import build_tx, sign_txn_and_send
from .contracts import AsyncContract
from ..abis.tokens import abi as abi_erc20


def to_wei_from_decimals(number: Union[int, float, str, Decimal], decimals: int) -> int:
    """
    Takes a number of a unit and converts it to wei.
    """

    if is_integer(number) or is_string(number):
        d_number = Decimal(value=number)
    elif isinstance(number, float):
        d_number = Decimal(value=str(number))
    elif isinstance(number, Decimal):
        d_number = number
    else:
        raise TypeError("Unsupported type. Must be one of integer, float, or string")

    s_number = str(number)
    unit_value = Decimal(10 ** decimals)

    if d_number == Decimal(0):
        return 0

    if d_number < 1 and "." in s_number:
        with localcontext() as ctx:
            multiplier = len(s_number) - s_number.index(".") - 1
            ctx.prec = multiplier
            d_number = Decimal(value=number, context=ctx) * 10 ** multiplier
        unit_value /= 10 ** multiplier

    with localcontext() as ctx:
        ctx.prec = 999
        result_value = Decimal(value=d_number, context=ctx) * unit_value

    if result_value < MIN_WEI or result_value > MAX_WEI:
        raise ValueError("Resulting wei value must be between 0 and 2**256 - 1")

    return int(result_value)


class Token(AsyncContract):
    def balance_of(self, address: str) -> int:
        balance: int = self._functions.balanceOf(
            self._w3.to_checksum_address(address)
        ).call()
        return balance


class ERC20(Token):
    def __init__(self, w3: AsyncWeb3, address: str, abi: str = abi_erc20, chain_id: int = None):
        super().__init__(w3, address, abi, chain_id)

    async def decimals(self) -> int:
        return await self._functions.decimals().call()

    async def to_decimals(self, amount: Union[int, float, Decimal]) -> int:
        return to_wei_from_decimals(amount, await self.decimals())

    async def from_decimals(self, amount: int) -> Decimal:
        return Decimal(amount) / Decimal(10 ** await self.decimals())

    async def transfer(
        self,
        to_address: Union[HexAddress, str],
        amount: int,
        private_key: str,
    ) -> HexBytes:
        account = self._w3.eth.account.from_key(private_key)
        tx = await build_tx(
            w3=self._w3,
            from_address=account.address,
            gas=100000,
            chain_id=self.chain_id
        )
        transaction_made = await self._functions.transfer(
            self._w3.to_checksum_address(to_address), amount
        ).build_transaction(tx)

        send_tx = await sign_txn_and_send(
            w3=self._w3,
            transaction=transaction_made,
            private_key=account.key,
        )
        return send_tx

    async def balance_of(self, address: str, raw: bool = True) -> Union[int, Decimal]:
        balance = await self._functions.balanceOf(
            self._w3.to_checksum_address(address)
        ).call()
        return balance if raw else await self.from_decimals(balance)

    async def allowance(self, owner: str, spender: str) -> int:
        amount = await self._functions.allowance(
            self._w3.to_checksum_address(owner),
            self._w3.to_checksum_address(spender),
        ).call()
        return amount

    async def approve(
        self,
        to_address: Union[HexAddress, str],
        amount: int,
        private_key: str
    ) -> HexBytes:
        account = self._w3.eth.account.from_key(private_key)
        tx = await build_tx(
            w3=self._w3,
            from_address=account.address,
            gas=100000,
            chain_id=self.chain_id
        )
        transaction_made = await self._functions.approve(
            self._w3.to_checksum_address(to_address), amount
        ).build_transaction(tx)

        send_tx = await sign_txn_and_send(
            w3=self._w3,
            transaction=transaction_made,
            private_key=account.key,
        )
        return send_tx
