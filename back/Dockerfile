FROM python:3.11-slim

WORKDIR /app

# 컨테이너 내부에 파이썬 버퍼링을 없애 로그가 실시간으로 찍히도록 설정
ENV PYTHONUNBUFFERED=1

# 종속성 파일 복사 및 설치 (캐싱 최적화)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 백엔드 소스 코드 전체 복사
COPY . .

EXPOSE 8000

# uvicorn 실행 (0.0.0.0으로 열어야 도커 외부/프론트엔드와 통신 가능)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]