from web3 import AsyncWeb3

from cache import redis


provider = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(redis.get("rpc_url")))
