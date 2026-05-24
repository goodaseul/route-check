from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.search import router as search_router

app = FastAPI(title="RouteCheck Search Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 검색 관련 라우터 장착
app.include_router(search_router)

@app.get("/")
def read_root():
    return {"message": "통합 검색 서버 정상 작동 중"}