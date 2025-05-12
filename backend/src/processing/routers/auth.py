import logging

from django.conf import settings
from django.db import IntegrityError
from ninja import Router
from ninja.responses import codes_4xx, codes_5xx
from ninja_extra import status

from blockchain.eth.contracts import get_account_factory, get_rub
from blockchain.eth.provider import provider
from helpers.schemas.base import JSONResponseException
from processing.models import Account
from processing.schemas.auth import SignUpSchema


logger = logging.getLogger(__name__)
router = Router()


@router.post(
    "/sign-up",
    response={
        status.HTTP_201_CREATED: SignUpSchema.get_response_schema(),
        codes_4xx: JSONResponseException,
        codes_5xx: JSONResponseException,
    },
)
async def sign_up(
    request,
    body: SignUpSchema,
):
    try:
        account: Account = await Account.objects.acreate(**body.dict())
    except IntegrityError:
        return status.HTTP_409_CONFLICT, JSONResponseException(
            detail="Account with this email already exists.",
        )
    contract = get_account_factory()
    try:
        txid = await contract.create_account(
            account.signer,
            account.recovery_signer,
            settings.PRIVATE_KEY,
        )
        await provider.eth.wait_for_transaction_receipt(txid)
        logger.info(f"Account created with txid: {txid.hex()}")
    except Exception as e:
        logger.error(f"Error creating account: {e}")
        return status.HTTP_500_INTERNAL_SERVER_ERROR, JSONResponseException(
            detail="Error creating account on blockchain.",
        )
    data = await contract.get_user_by_signer(account.signer)
    account.contract_address = data[2]

    try:
        rub_contract = get_rub()
        txid = await rub_contract.transfer(
            to_address=account.contract_address,
            amount=await rub_contract.to_decimals(1000),
            private_key=settings.PRIVATE_KEY
        )
        logger.info(f"Transfer txid: {txid.hex()}")
    except Exception as e:
        logger.error(e)

    await account.asave()
    response = SignUpSchema.get_response_schema()
    return status.HTTP_201_CREATED, response.from_orm(account)
