class PendingTransaction(Exception):
    def __init__(self, tx_hash: str) -> None:
        super().__init__(f"status transaction is pending: {tx_hash}")
