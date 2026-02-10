"""
Celery 애플리케이션 설정
"""
from celery import Celery
from celery.schedules import crontab
import os

# Redis URL
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "mediplaton",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=[
        "app.tasks.notifications",
        "app.tasks.reports",
        "app.tasks.crawl",
        "app.tasks.bidding",
        "app.tasks.realestate_tasks",
        "app.tasks.prospect_tasks",
        "app.tasks.campaign_tasks",
        "app.tasks.sales_match_tasks",
        "app.tasks.listing_subscription_tasks",
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

    # ===== 부동산 매물 수집 =====
    # 매일 새벽 3시: 부동산 매물 크롤링
    "daily-realestate-crawl": {
        "task": "app.tasks.realestate_tasks.run_realestate_crawl",
        "schedule": crontab(hour=3, minute=0),
    },
    # 매일 새벽 4시: 만료 매물 정리
    "update-expired-listings": {
        "task": "app.tasks.realestate_tasks.update_expired_listings",
        "schedule": crontab(hour=4, minute=0),
    },

    # ===== 약국 타겟팅 =====
    # 매주 월요일 새벽 5시: 전국 약국 타겟팅 스캔
    "weekly-pharmacy-prospect-scan": {
        "task": "app.tasks.prospect_tasks.run_pharmacy_prospect_scan",
        "schedule": crontab(day_of_week=1, hour=5, minute=0),
    },

    # ===== 캠페인 통계 =====
    # 매일 오후 6시: 캠페인 통계 집계
    "daily-campaign-stats": {
        "task": "app.tasks.campaign_tasks.get_campaign_stats",
        "schedule": crontab(hour=18, minute=0),
    },

    # ===== 영업사원 매칭 =====
    # 매 시간: 48시간 초과 매칭 요청 자동 만료 및 환불
    "expire-pending-match-requests": {
        "task": "app.tasks.sales_match_tasks.expire_pending_match_requests",
        "schedule": crontab(minute=0),  # 매 정시
    },
    # 매 6시간: 매칭 요청 응답 리마인더 발송 (24시간 경과 건)
    "match-request-reminder": {
        "task": "app.tasks.sales_match_tasks.send_match_request_reminder",
        "schedule": crontab(hour="*/6", minute=30),
    },

    # ===== 매물 등록 구독 =====
    # 매일 오전 6시: 구독 자동갱신 결제
    "listing-subscription-renewals": {
        "task": "app.tasks.listing_subscription_tasks.process_listing_renewals",
        "schedule": crontab(hour=6, minute=0),
    },
    # 매일 자정: 취소된 구독 만료 처리
    "listing-subscription-expire": {
        "task": "app.tasks.listing_subscription_tasks.expire_canceled_subscriptions",
        "schedule": crontab(hour=0, minute=0),
    },
}
