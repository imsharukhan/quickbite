import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv
import os

load_dotenv()

from app.database import Base
from app.users.models import User
from app.vendors.models import Vendor
from app.outlets.models import Outlet
from app.menu.models import MenuItem
from app.orders.models import Order, OrderItem, Rating
from app.notifications.models import Notification

target_metadata = Base.metadata

def get_url():
    url = os.getenv("DATABASE_URL", "")
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    url = url.split("?")[0]
    return url

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()

async def run_async_migrations():
    connectable = create_async_engine(get_url(), poolclass=pool.NullPool)
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()

def run_migrations_online():
    asyncio.run(run_async_migrations())

if context.is_offline_mode():
    raise Exception("Offline mode not supported. Use online mode only.")
else:
    run_migrations_online()
