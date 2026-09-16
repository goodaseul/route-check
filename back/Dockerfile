FROM python:3.11-slim

WORKDIR /app

# 컨테이너 내부에 파이썬 버퍼링을 없애 로그가 실시간으로 찍히도록 설정
ENV PYTHONUNBUFFERED=1

# 종속성 파일 복사 및 설치 (캐싱 최적화)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스 코드 전체 복사
COPY . .

EXPOSE 8080

# uvicorn 실행 (Cloud Run 주입 $PORT 대응, 미지정시 기본 8080)
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]