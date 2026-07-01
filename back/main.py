from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.search import router as search_router
from routers.admin.auth import router as admin_auth_router
from routers.admin.user import router as admin_user_router
from routers.admin.user_management import router as user_management_router
from routers.auth import router as auth_router
# from scheduler import start_scheduler

from db.database import Base, engine, SessionLocal
from db.models import AdminRole, AdminUser
from core.security import hash_password

# Setup logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("FastAPI Server Startup: Verifying Database tables...")
    try:
        # 어드민 테이블 생성 자동 실행
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified successfully.")

        # 기본 최고 관리자 시딩
        db = SessionLocal()
        try:
            superadmin_exists = db.query(AdminUser).filter(
                AdminUser.role == AdminRole.SUPERADMIN,
                AdminUser.deleted_at.is_(None)
            ).first()
            if not superadmin_exists:
                logger.info("No active superadmin found. Seeding default superadmin 'admin'...")
                default_admin = AdminUser(
                    username="admin",
                    password_hash=hash_password("admin1234"),
                    role=AdminRole.SUPERADMIN,
                    is_active=True
                )
                db.add(default_admin)
                db.commit()
                logger.info("Default superadmin seeded successfully (ID: admin / PW: admin1234).")
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Error during Database setup: {e}")

    # logger.info("FastAPI Server Startup: Starting background scheduler...")
    # start_scheduler()
    yield
    logger.info("FastAPI Server Shutdown: Cleaning up...")

app = FastAPI(
    title="RouteCheck Search Server",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 장착
app.include_router(search_router)
app.include_router(admin_auth_router)
app.include_router(admin_user_router)
app.include_router(user_management_router)
app.include_router(auth_router)

@app.get("/")
def read_root():
    return {"message": "통합 검색 서버 정상 작동 중"}