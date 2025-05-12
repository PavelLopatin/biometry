from ninja import Router

from .account import router as info_router
from .auth import router as auth_router


router = Router()
router.add_router("auth", auth_router, tags=["Auth"])
router.add_router("account", info_router, tags=["Account"])
