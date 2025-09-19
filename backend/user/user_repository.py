from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from geoalchemy2.functions import ST_GeogFromText, ST_DWithin
from sqlalchemy import func, text
from src.user.user_entity import User, UserRole, UserModel
from src.base import Location


class UserRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def create(self, user: User) -> User:
        """Create a new user"""
        try:
            user_model = UserModel(
                Name=user.name,
                ContactInfo=user.contact_info,
                Location=user.location.to_postgis_geography()
                if user.location
                else None,
                Address=user.location.address if user.location else None,
                PasswordString=user.password_string,
                Role=user.role.value,
            )

            self.session.add(user_model)
            await self.session.flush()

            created_user = self._model_to_entity(user_model, user.location)
            return created_user

        except SQLAlchemyError as e:
            await self.session.rollback()
            raise Exception(f"Failed to create user: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        try:
            result = await self.session.execute(
                select(
                    UserModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                    UserModel.Address.label("address"),
                ).where(UserModel.UserID == user_id)
            )
            row = result.first()

            if not row:
                return None

            return self._row_to_entity(row)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get user by ID: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_all(self) -> List[User]:
        """Get all users"""
        try:
            result = await self.session.execute(
                select(
                    UserModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                    UserModel.Address.label("address"),
                )
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get all users: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_role(self, role: UserRole) -> List[User]:
        """Get users by role"""
        try:
            result = await self.session.execute(
                select(
                    UserModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                    UserModel.Address.label("address"),
                ).where(UserModel.Role == role.value)
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get users by role: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_users_within_distance(
        self, center: Location, distance_meters: float
    ) -> List[User]:
        """Get users within a certain distance from a center point"""
        try:
            result = await self.session.execute(
                select(
                    UserModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                    UserModel.Address.label("address"),
                ).where(
                    ST_DWithin(
                        UserModel.Location,
                        center.to_postgis_geography(),
                        distance_meters,
                    )
                )
            )
            rows = result.all()

            return [self._row_to_entity(row) for row in rows]

        except SQLAlchemyError as e:
            raise Exception(f"Failed to get users within distance: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    async def get_by_email_and_password(
        self, email: str, password: str
    ) -> Optional[User]:
        """Get user by email (contact_info) and password for login"""
        try:
            result = await self.session.execute(
                select(
                    UserModel,
                    func.ST_X(text("location::geometry")).label("longitude"),
                    func.ST_Y(text("location::geometry")).label("latitude"),
                    UserModel.Address.label("address"),
                ).where(
                    UserModel.ContactInfo == email, UserModel.PasswordString == password
                )
            )
            row = result.first()

            if not row:
                return None

            return self._row_to_entity(row)

        except SQLAlchemyError as e:
            raise Exception(f"Failed to authenticate user: {str(e)}")

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    def _row_to_entity(self, row) -> User:
        """Convert SQLAlchemy row to domain entity"""
        user_model = row[0]
        location = Location.from_db_row(row)

        return User(
            user_id=user_model.UserID,
            name=user_model.Name,
            contact_info=user_model.ContactInfo,
            location=location,
            password_string=user_model.PasswordString,
            role=UserRole(user_model.Role),
        )

    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------
    # --------------------------------------------------------------------------------------------------------------------------------------------------

    def _model_to_entity(
        self, user_model: UserModel, location: Optional[Location] = None
    ) -> User:
        """Convert SQLAlchemy model to domain entity"""
        return User(
            user_id=user_model.UserID,
            name=user_model.Name,
            contact_info=user_model.ContactInfo,
            location=location,
            password_string=user_model.PasswordString,
            role=UserRole(user_model.Role),
        )
