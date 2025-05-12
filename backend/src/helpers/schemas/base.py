from ninja import Schema


class JSONResponseException(Schema):
    detail: str
