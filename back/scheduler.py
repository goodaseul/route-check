import os
import time
import threading
import logging
from scripts.collect_tour_data import collect_data

logger = logging.getLogger("scheduler")

def run_scheduler_loop(interval_days: int, run_on_startup: bool):
    """
    백그라운드 스케줄러의 메인 루프.
    """
    logger.info("백그라운드 스케줄러 루프가 시작되었습니다.")
    
    # 1. 시작 시 데이터 존재 여부 체크
    if run_on_startup:
        # CSV 파일이 존재하는지 확인
        base_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(base_dir, "data", "관광정보_메인_장소_데이터.csv")
        
        if not os.path.exists(csv_path):
            logger.info("관광정보 메인 CSV 데이터 파일이 존재하지 않습니다. 시작 시 초기 데이터 수집을 실행합니다...")
            try:
                # 데이터 수집 실행
                collect_data()
            except Exception as e:
                logger.error(f"시작 시 초기 데이터 수집 실패: {e}")
        else:
            logger.info("관광정보 CSV 데이터 파일이 이미 존재합니다. 시작 시 데이터 수집을 건너뜁니다.")
    
    interval_seconds = interval_days * 86400
    logger.info(f"스케줄러 주기가 {interval_days}일({interval_seconds}초)로 설정되었습니다.")

    # 2. 무한 스케줄러 루프
    while True:
        try:
            # 설정된 간격만큼 대기
            logger.info(f"다음 예약 실행까지 {interval_days}일 동안 대기합니다...")
            time.sleep(interval_seconds)
            
            logger.info("예약된 데이터 수집을 지금 시작합니다...")
            collect_data()
        except Exception as e:
            logger.error(f"예약 데이터 수집 중 오류 발생: {e}")

def start_scheduler():
    """
    스케줄러 루프를 백그라운드 데몬 스레드에서 시작.
    """
    interval_days = int(os.getenv("TOUR_DATA_UPDATE_INTERVAL_DAYS", "1"))
    run_on_startup_str = os.getenv("RUN_TOUR_DATA_UPDATE_ON_STARTUP", "true").lower()
    run_on_startup = run_on_startup_str in ("true", "1", "yes", "y")

    # 메인 프로세스 종료 시 함께 종료되도록 데몬 스레드로 시작.
    thread = threading.Thread(
        target=run_scheduler_loop,
        args=(interval_days, run_on_startup),
        daemon=True,
        name="TourDataScheduler"
    )
    thread.start()
    logger.info("TourDataScheduler 데몬 스레드가 성공적으로 시작되었습니다.")
