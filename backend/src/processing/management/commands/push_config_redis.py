import json
import logging

from django.core.management import BaseCommand

from cache import redis


logger = logging.getLogger(__name__)


class Command(BaseCommand):
    def handle(self, *args, **options):
        with open("config.json") as f:
            config = json.load(f)

        for key, value in config.items():
            redis.set(key, value)

        logger.info('Config set successfully')
