from typing import Type

from ninja import Schema
from pydantic import EmailStr


class AccountSchema(Schema):
    signer: str
    recovery_signer: str
    contract_address: str
    helper: str


class SignUpSchema(Schema):
    email: EmailStr
    signer: str
    recovery_signer: str
    helper: str

    @classmethod
    def get_response_schema(cls) -> Type["AccountSchema"]:
        return AccountSchema
