import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
IS_LOCAL_ENV = APP_ENV in {"development", "dev", "local", "test"}

if IS_LOCAL_ENV:
    # 개발/테스트 환경에서는 외부 DB 상태와 무관하게 로컬 SQLite를 사용한다.
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.abspath(os.path.join(current_dir, "../data/route_check.db"))
    DATABASE_URL = f"sqlite:///{sqlite_path}"
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    logger.info("Database environment=%s: using SQLite at %s", APP_ENV, sqlite_path)
else:
    # staging/production 환경에서는 Supabase 연결을 필수로 한다.
    # 운영 중 로컬 SQLite로 조용히 전환되면 서버마다 캐시가 분리되므로 실패시 즉시 중단한다.
    DATABASE_URL = os.getenv("DATABASE_URL", "").strip()
    if not DATABASE_URL:
        raise RuntimeError(f"DATABASE_URL is required when APP_ENV={APP_ENV}.")
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    if not DATABASE_URL.startswith(("postgresql://", "postgresql+psycopg2://")):
        raise RuntimeError(
            f"PostgreSQL DATABASE_URL is required when APP_ENV={APP_ENV}."
        )

    engine = create_engine(
        DATABASE_URL,
        connect_args={"connect_timeout": 5},
        pool_pre_ping=True,
    )
    try:
        with engine.connect():
            pass
    except Exception as exc:
        logger.error("Supabase PostgreSQL connection failed in %s.", APP_ENV)
        raise RuntimeError("Unable to connect to Supabase PostgreSQL.") from exc
    logger.info("Database environment=%s: connected to Supabase PostgreSQL", APP_ENV)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
