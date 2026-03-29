from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.users import schemas, service
from app.auth.dependencies import get_current_user
from app.users.models import User

router = APIRouter()

@router.get("/me", response_model=schemas.UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.patch("/me", response_model=schemas.UserResponse)
async def update_me(data: schemas.UserUpdate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    user = await service.update_user(db, str(current_user.id), data)
    return user

@router.post("/change-password")
async def change_user_password(data: schemas.ChangePassword, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    await service.change_password(db, str(current_user.id), data.old_password, data.new_password)
    return {"message": "Password changed successfully"}
