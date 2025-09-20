from pydantic_settings import BaseSettings


class DatabaseSettings(BaseSettings):
    """Database configuration settings"""

    # Database Configuration
    DB_HOST: str
    DB_PORT: int = 5432
    DB_NAME: str
    DB_USER: str
    DB_PASSWORD: str

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Allow extra fields in .env file

    @property
    def async_database_url(self) -> str:
        """Construct async PostgreSQL database URL"""
        return (
            f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}"
            f"@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
        )


# Global settings instance
database_settings = DatabaseSettings()
