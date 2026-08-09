import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

logger = logging.getLogger(__name__)

# Load environment variables from .env
load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")
engine = None

# PostgreSQL 연결 시도
try:
    if DATABASE_URL:
        # Supabase postgresql scheme 호환 처리
        if DATABASE_URL.startswith("postgres://"):
            DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
        
        # 연결 타임아웃을 짧게 주어 확인
        engine = create_engine(DATABASE_URL, connect_args={"connect_timeout": 3})
        # 실제 연결 테스트 실행
        with engine.connect() as conn:
            pass
        logger.info("Successfully connected to Supabase PostgreSQL database.")
    else:
        raise ValueError("DATABASE_URL is empty or not set.")
except Exception as e:
    logger.warning(f"Database connection failed: {e}. Falling back to local SQLite database...")
    
    # SQLite fallback 데이터베이스 파일 설정
    current_dir = os.path.dirname(os.path.abspath(__file__))
    sqlite_path = os.path.abspath(os.path.join(current_dir, "../data/route_check.db"))
    DATABASE_URL = f"sqlite:///{sqlite_path}"
    
    # SQLite는 멀티스레드 세션 공유를 위해 check_same_thread=False 필요
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
    logger.info(f"SQLite database initialized at: {sqlite_path}")

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

