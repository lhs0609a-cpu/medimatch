"""
Celery 애플리케이션 설정
"""
from celery import Celery
from celery.schedules import crontab
import os

# Redis URL
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "medimatch",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "app.tasks.notifications",
        "app.tasks.reports",
        "app.tasks.crawl",
        "app.tasks.bidding",
    ]
)

# Celery 설정
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Seoul",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1시간 타임아웃
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# 주기적 태스크 스케줄
celery_app.conf.beat_schedule = {
    # 매일 새벽 2시: 전체 크롤링
    "daily-crawl": {
        "task": "app.tasks.crawl.run_daily_crawl",
        "schedule": crontab(hour=2, minute=0),
    },
    # 매 6시간: 폐업 체크
    "check-closed-hospitals": {
        "task": "app.tasks.crawl.check_closed_hospitals",
        "schedule": crontab(hour="*/6", minute=0),
    },
    # 매 30분: 만료된 입찰 처리
    "expire-bids": {
        "task": "app.tasks.bidding.expire_old_bids",
        "schedule": crontab(minute="*/30"),
    },
    # 매일 오전 9시: 일일 리포트 발송
    "daily-report": {
        "task": "app.tasks.reports.send_daily_digest",
        "schedule": crontab(hour=9, minute=0),
    },
    # 매 시간: 알림 처리
    "process-alerts": {
        "task": "app.tasks.notifications.process_pending_alerts",
        "schedule": crontab(minute=0),
    },
}
