import logging

from django.conf import settings
from eth_typing import HexStr
from eth_utils import add_0x_prefix
from ninja import Router
from ninja.responses import codes_4xx, codes_5xx
from ninja_extra import status
from pydantic import EmailStr

from blockchain.eth.contracts import get_account
from blockchain.eth.provider import provider
from helpers.schemas.base import JSONResponseException
from processing.models import Account
from processing.schemas.account import ExecuteSchema
from processing.schemas.auth import AccountSchema


logger = logging.getLogger(__name__)
router = Router()


@router.get(
    "/get-smart-wallet-by-signer/{address}",
    response={
        status.HTTP_200_OK: AccountSchema,
        codes_4xx: JSONResponseException,
        codes_5xx: JSONResponseException,
    },
)
async def get_smart_wallet_by_signer(
    request,
    address: str,
):
    try:
        account = await Account.objects.aget(signer=address)
        return status.HTTP_200_OK, AccountSchema.from_orm(account)
    except Account.DoesNotExist:
        logger.error(f"Error getting smart wallet: {address}")
        return status.HTTP_500_INTERNAL_SERVER_ERROR, JSONResponseException(
            detail="Error getting smart wallet.",
        )


@router.get(
    "/get-smart-wallet-by-helper/{helper}",
    response={
        status.HTTP_200_OK: AccountSchema,
        codes_4xx: JSONResponseException,
        codes_5xx: JSONResponseException,
    },
)
async def get_smart_wallet_by_helper(
    request,
    helper: str,
):
    try:
        account = await Account.objects.aget(helper=helper)
        return status.HTTP_200_OK, AccountSchema.from_orm(account)
    except Account.DoesNotExist:
        logger.error(f"Error getting smart wallet")
        return status.HTTP_404_NOT_FOUND, JSONResponseException(
            detail="Error getting smart wallet.",
        )


@router.get(
    "/get-smart-wallet-by-email/{email}",
    response={
        status.HTTP_200_OK: AccountSchema,
        codes_4xx: JSONResponseException,
        codes_5xx: JSONResponseException,
    },
)
async def get_smart_wallet_by_email(
    request,
    email: EmailStr,
):
    try:
        account = await Account.objects.aget(email=email)
        return status.HTTP_200_OK, AccountSchema.from_orm(account)
    except Account.DoesNotExist:
        logger.error(f"Error getting smart wallet")
        return status.HTTP_404_NOT_FOUND, JSONResponseException(
            detail="Error getting smart wallet.",
        )


@router.post(
    "/execute/{address}",
    response={
        status.HTTP_200_OK: ExecuteSchema.get_response_schema(),
        codes_4xx: JSONResponseException,
        codes_5xx: JSONResponseException,
    },
)
async def execute(
    request,
    address: str,
    body: ExecuteSchema,
):
    try:
        contract = get_account(address)
        txid = await contract.execute(
            body.dest,
            body.value,
            bytes.fromhex(body.func.replace("0x", "")),
            bytes.fromhex(body.signature.replace("0x", "")),
            settings.PRIVATE_KEY,
        )
        tx_data = await provider.eth.wait_for_transaction_receipt(txid)
        print(tx_data)
        logger.info(f"Transaction executed with txid: {txid.hex()}")
        response = body.get_response_schema()
        return status.HTTP_200_OK, response(txid=add_0x_prefix(HexStr(txid.hex())))
    except Exception as e:
        logger.error(f"Error executing transaction: {e}")
        return status.HTTP_500_INTERNAL_SERVER_ERROR, JSONResponseException(
            detail="Error executing transaction.",
        )
