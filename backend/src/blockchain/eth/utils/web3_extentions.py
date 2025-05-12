from typing import Optional, Union

from eth_typing import HexStr
from eth_typing.evm import AnyAddress, Hash32
from hexbytes import HexBytes
from web3 import AsyncWeb3
from web3.exceptions import TransactionNotFound
from web3.types import TxParams

from blockchain.eth.exception import PendingTransaction


async def build_tx(
    w3: AsyncWeb3,
    from_address: Union[AnyAddress, str],
    chain_id: Union[int, str] = None,
    gas: Union[None, int, str] = None,
    gas_price: Union[None, int, str] = None,
) -> dict:
    from_address = w3.to_checksum_address(from_address)
    nonce = await w3.eth.get_transaction_count(from_address, "pending")
    tx = {
        "chainId": chain_id if chain_id else await w3.eth.chain_id,
        "gasPrice": gas_price if gas_price else await w3.eth.gas_price,
        "nonce": nonce,
        "from": from_address,
    }

    if gas:
        tx["gas"] = gas
    return tx


async def sign_txn_and_send(w3: AsyncWeb3, transaction: TxParams, private_key: str) -> HexBytes:
    signed_txn = w3.eth.account.sign_transaction(transaction, private_key)
    return await w3.eth.send_raw_transaction(signed_txn.raw_transaction)


async def send_native_token(
    provider: AsyncWeb3,
    to_address: str,
    amount: Union[float, int],
    private_key: str,
    gas_price: Optional[int] = None,
    from_address: Optional[str] = None,
    chain_id: Optional[int] = None,
    decimals: int = 18,
) -> HexBytes:
    chain_id = chain_id if chain_id else await provider.eth.chain_id
    from_address = (
        provider.eth.account.from_key(private_key).address
        if not from_address
        else from_address
    )
    tx = await build_tx(
        provider,
        chain_id=chain_id,
        from_address=from_address,
        gas=21_000,
        gas_price=gas_price,
    )
    tx.update(
        {
            "value": int(amount * 10 ** decimals),
            "to": provider.to_checksum_address(to_address),
        }
    )
    return await sign_txn_and_send(provider, tx, private_key)


async def get_tx_status(w3: AsyncWeb3, tx_hash: Union[Hash32, HexBytes, HexStr]) -> bool:
    try:
        tx_receipt = await w3.eth.get_transaction_receipt(tx_hash)
        return bool(tx_receipt["status"])
    except TransactionNotFound:
        try:
            await w3.eth.get_transaction(tx_hash)
        except TransactionNotFound:
            return False
        raise PendingTransaction(tx_hash)
