from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from app.users.models import User
from app.users.schemas import UserUpdate
from app.auth.utils import verify_password, hash_password

async def get_user_by_id(db: AsyncSession, user_id: str) -> User | None:
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()

async def update_user(db: AsyncSession, user_id: str, data: UserUpdate) -> User | None:
    user = await get_user_by_id(db, user_id)
    if not user:
        return None
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email
    await db.commit()
    await db.refresh(user)
    return user

async def change_password(db: AsyncSession, user_id: str, old_pass: str, new_pass: str) -> bool:
    user = await get_user_by_id(db, user_id)
    if not user:
        return False
    if not verify_password(old_pass, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    user.password_hash = hash_password(new_pass)
    await db.commit()
    return True
