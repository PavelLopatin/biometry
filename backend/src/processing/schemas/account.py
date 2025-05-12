from typing import Type

from ninja import Schema


class TxStatusSchema(Schema):
    txid: str


class ExecuteSchema(Schema):
    dest: str
    value: int
    func: str
    signature: str

    @classmethod
    def get_response_schema(cls) -> Type[TxStatusSchema]:
        return TxStatusSchema
