from django.conf import settings

from cache.provider import RedisOverride

redis = RedisOverride(
    host=settings.REDIS_HOST, port=settings.REDIS_PORT,
    password=settings.REDIS_PASSWORD
)
