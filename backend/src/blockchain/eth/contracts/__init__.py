from cache import redis
from .absctract.tokens import ERC20
from .account import SimpleAccount
from ..contracts.account_factory import SympleAccountFactory
from ..provider import provider


def get_account_factory() -> SympleAccountFactory:
    return SympleAccountFactory(
        w3=provider,
        address=redis.get("simple_account_factory"),
        chain_id=redis.get("chain_id")
    )


def get_account(
    address: str,
) -> SimpleAccount:
    return SimpleAccount(
        w3=provider,
        address=address,
        chain_id=redis.get("chain_id")
    )


def get_rub() -> ERC20:
    return ERC20(
        w3=provider,
        address=redis.get("rub_address"),
        chain_id=redis.get("chain_id")
    )
