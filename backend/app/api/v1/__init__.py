from fastapi import APIRouter
from .auth import router as auth_router
from .simulate import router as simulate_router
from .slots import router as slots_router
from .bids import router as bids_router
from .prospects import router as prospects_router
from .alerts import router as alerts_router
from .export import router as export_router
from .map import router as map_router
from .partner import router as partner_router
from .payment import router as payment_router
from .oauth import router as oauth_router
from .pharmacy_match import router as pharmacy_match_router
from .escrow import router as escrow_router
from .hira import router as hira_router
from .realestate import router as realestate_router
from .prospect import router as prospect_router
from .campaign import router as campaign_router
from .chat import router as chat_router
from .notification import router as notification_router
from .admin import router as admin_router
from .landlord import router as landlord_router
from .banner import router as banner_router
from .sales_match import router as sales_match_router
from .dashboard import router as dashboard_router
from .group_buying import router as group_buying_router
from .favorites import router as favorites_router
from .contact import router as contact_router
from .listing_subscription import router as listing_subscription_router
from .pharmacy_transfer import router as pharmacy_transfer_router
from .service_subscription import router as service_subscription_router
from .demographics import router as demographics_router
from .emr_dashboard import router as emr_dashboard_router
from .broker import router as broker_router
from .admin_broker import router as admin_broker_router
from .claims import router as claims_router
from .claims_ai import router as claims_ai_router
from .claims_edi import router as claims_edi_router
from .claims_appeal import router as claims_appeal_router
from .claims_analytics import router as claims_analytics_router
from .claims_import import router as claims_import_router
from .tickets import router as tickets_router
from .patient_tags import router as patient_tags_router
from .visit_analytics import router as visit_analytics_router
from .dur import router as dur_router
from .hira_codes import router as hira_codes_router
from .tax import router as tax_v2_router
from .staff_cost import router as staff_cost_router
from .fixed_cost import router as fixed_cost_router
from .supply_price import router as supply_price_router
from .marketing_roi import router as marketing_roi_router
from .patients import router as patients_router
from .patient_recall import router as patient_recall_router
from .opening_project import router as opening_project_router
from .admin_contacts import router as admin_contacts_router
from .community import router as community_router
from .maintenance import router as maintenance_router
from .growth_tools import router as growth_tools_router
from .visits import router as visits_router
from .appointments import router as appointments_router
from .prescriptions import router as prescriptions_router
from .bills import router as bills_router
from .emr_export import router as emr_export_router
from .doctor_lead import router as doctor_lead_router
from .diagnosis import router as diagnosis_router
from .roadmap import router as roadmap_router
from .cdss import router as cdss_router
from .questionnaire import doctor_router as questionnaire_doctor_router, public_router as questionnaire_public_router
from .stt import router as stt_router
from .attachments import doctor_router as attachments_doctor_router, public_router as attachments_public_router
from .external_appointments import doctor_router as ext_appt_doctor_router, webhook_router as ext_appt_webhook_router
from .pharmacy_pickup import router as pharmacy_pickup_router
from .clinic_setup import router as clinic_setup_router
from .chronic_care import router as chronic_care_router
from .staff_seats import router as staff_seats_router
from .admin_schema import router as admin_schema_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(oauth_router, tags=["OAuth"])
api_router.include_router(hira_router, prefix="/hira", tags=["HIRA - 심평원 API"])
api_router.include_router(simulate_router, prefix="/simulate", tags=["OpenSim - Simulation"])
api_router.include_router(slots_router, prefix="/slots", tags=["PharmMatch - Slots"])
api_router.include_router(bids_router, prefix="/bids", tags=["PharmMatch - Bids"])
api_router.include_router(pharmacy_match_router, prefix="/pharmacy-match", tags=["PharmMatch v2 - Anonymous Matching"])
api_router.include_router(prospects_router, prefix="/prospects", tags=["SalesScanner - Prospects"])
api_router.include_router(alerts_router, prefix="/alerts", tags=["SalesScanner - Alerts"])
api_router.include_router(export_router, prefix="/export", tags=["Export"])
api_router.include_router(map_router, prefix="/map", tags=["Map"])
api_router.include_router(partner_router, tags=["Partners"])
api_router.include_router(payment_router, tags=["Payments"])
api_router.include_router(escrow_router, prefix="/escrow", tags=["Escrow - Partner Transactions"])
api_router.include_router(realestate_router, prefix="/realestate", tags=["Real Estate - 부동산 매물"])
api_router.include_router(prospect_router, prefix="/pharmacy-prospects", tags=["Pharmacy Prospects - 약국 타겟팅"])
api_router.include_router(campaign_router, prefix="/campaigns", tags=["Campaigns - 아웃바운드 캠페인"])
api_router.include_router(chat_router, tags=["Chat - 파트너 채팅"])
api_router.include_router(notification_router, tags=["Notifications - 알림 시스템"])
api_router.include_router(admin_router, prefix="/admin", tags=["Admin - 관리자"])
api_router.include_router(admin_schema_router, prefix="/admin", tags=["Admin - Schema 버전 관측"])
api_router.include_router(landlord_router, prefix="/landlord", tags=["Landlord - 건물주 셀프 등록"])
api_router.include_router(banner_router, tags=["Banner - 배너 광고 CPM"])
api_router.include_router(sales_match_router, tags=["Sales Match - 영업사원 매칭"])
api_router.include_router(dashboard_router, tags=["Dashboard - 대시보드"])
api_router.include_router(group_buying_router, prefix="/group-buying", tags=["Group Buying - 개원 공동구매"])
api_router.include_router(favorites_router, prefix="/favorites", tags=["Favorites - 즐겨찾기"])
api_router.include_router(contact_router, prefix="/contact", tags=["Contact - 문의"])
api_router.include_router(listing_subscription_router, prefix="/listing-subscription", tags=["Listing Subscription - 매물 등록 구독"])
api_router.include_router(pharmacy_transfer_router, prefix="/pharmacy-transfer", tags=["Pharmacy Transfer - 약국 양도"])
api_router.include_router(service_subscription_router, prefix="/service-subscription", tags=["Service Subscription - 서비스 구독"])
api_router.include_router(demographics_router, prefix="/demographics", tags=["Demographics - 인구통계 분석"])
api_router.include_router(emr_dashboard_router, prefix="/emr-dashboard", tags=["EMR Dashboard - 비즈니스 분석"])
api_router.include_router(broker_router, prefix="/broker", tags=["Broker - 부동산 중개인"])
api_router.include_router(admin_broker_router, prefix="/admin/broker", tags=["Admin Broker - 중개 관리"])
api_router.include_router(claims_router, prefix="/claims", tags=["Claims - 보험청구"])
api_router.include_router(claims_ai_router, prefix="/claims", tags=["Claims AI - AI 분석"])
api_router.include_router(claims_edi_router, prefix="/claims", tags=["Claims EDI - 심평원 EDI"])
api_router.include_router(claims_appeal_router, prefix="/appeals", tags=["Claims Appeal - 이의신청"])
api_router.include_router(claims_analytics_router, prefix="/claims-analytics", tags=["Claims Analytics - 청구 분석"])
api_router.include_router(claims_import_router, prefix="/claims", tags=["Claims Import - 기존 EMR 청구 임포트 + 누락 검출"])
api_router.include_router(tickets_router, prefix="/emr", tags=["EMR Tickets - 시술 회차권"])
api_router.include_router(patient_tags_router, prefix="/emr", tags=["EMR Patient Tags - 환자 운영 태그"])
api_router.include_router(visit_analytics_router, prefix="/emr/analytics", tags=["EMR Analytics - 방문 분석"])
api_router.include_router(dur_router, prefix="/dur", tags=["DUR - 약물 안전성"])
api_router.include_router(hira_codes_router, prefix="/hira-codes", tags=["HIRA Codes - 코드 검색"])
# tax_correction_router (v1) removed — v2 (tax/) includes all v1 endpoints plus extras
api_router.include_router(tax_v2_router, prefix="/tax-correction", tags=["Tax Correction - 경정청구"])
api_router.include_router(staff_cost_router, prefix="/emr/staff-cost", tags=["EMR Staff Cost - 인건비 최적화"])
api_router.include_router(fixed_cost_router, prefix="/emr/fixed-cost", tags=["EMR Fixed Cost - 고정비 절감"])
api_router.include_router(supply_price_router, prefix="/emr/supply-price", tags=["EMR Supply Price - 소모품/약가 비교"])
api_router.include_router(marketing_roi_router, prefix="/emr/marketing-roi", tags=["EMR Marketing ROI - 마케팅 ROI"])
api_router.include_router(patients_router, prefix="/emr/patients", tags=["EMR Patients - 환자 관리"])
api_router.include_router(patient_recall_router, prefix="/emr/crm", tags=["EMR CRM - 환자 리콜/캠페인"])
api_router.include_router(opening_project_router, prefix="/opening-projects", tags=["Opening Project - 개원 프로젝트"])
api_router.include_router(admin_contacts_router, prefix="/admin", tags=["Admin Contacts - 상담/문의 관리"])
api_router.include_router(community_router, prefix="/community", tags=["Community - 커뮤니티"])
api_router.include_router(maintenance_router, prefix="/maintenance", tags=["Maintenance - 관리유지비"])
api_router.include_router(growth_tools_router, tags=["Growth Tools - 성장/생존 도구 7종"])
api_router.include_router(visits_router, prefix="/emr/visits", tags=["EMR Visits - 전자차트"])
api_router.include_router(appointments_router, prefix="/emr/appointments", tags=["EMR Appointments - 예약"])
api_router.include_router(prescriptions_router, prefix="/emr/prescriptions", tags=["EMR Prescriptions - 처방전"])
api_router.include_router(bills_router, prefix="/emr/bills", tags=["EMR Bills - 수납"])
api_router.include_router(emr_export_router, prefix="/emr/export", tags=["EMR Export - CSV 내보내기"])
api_router.include_router(doctor_lead_router, prefix="/crm", tags=["CRM - 개원의 Lead 관리"])
api_router.include_router(diagnosis_router, tags=["Diagnosis - 개원 진단 1분 테스트"])
api_router.include_router(roadmap_router, prefix="/roadmap", tags=["Roadmap - 의사용 미션맵"])
api_router.include_router(cdss_router, prefix="/cdss", tags=["CDSS - 사전심사 9종 점검"])
api_router.include_router(questionnaire_doctor_router, prefix="/questionnaires", tags=["Questionnaire - 사전문진 (의사용)"])
api_router.include_router(questionnaire_public_router, prefix="/q", tags=["Questionnaire - 사전문진 (환자용)"])
api_router.include_router(stt_router, prefix="/stt", tags=["STT - 음성 → SOAP 자동파싱"])
api_router.include_router(attachments_doctor_router, prefix="/emr/visits", tags=["EMR Attachments - 차트 첨부 (의사용)"])
api_router.include_router(attachments_public_router, prefix="/upload", tags=["EMR Attachments - 폰 업로드 (Public)"])
api_router.include_router(ext_appt_doctor_router, prefix="/external-appointments", tags=["External Appointments - 외부 예약 인박스"])
api_router.include_router(ext_appt_webhook_router, prefix="/webhooks", tags=["External Appointments - Webhook"])
api_router.include_router(pharmacy_pickup_router, prefix="/pharmacy-pickup", tags=["Pharmacy Pickup - 약국 픽업코드"])
api_router.include_router(clinic_setup_router, prefix="/clinic-setup", tags=["Clinic Setup - 5분 온보딩"])
api_router.include_router(chronic_care_router, prefix="/chronic-care", tags=["Chronic Care - 만성질환관리"])
api_router.include_router(staff_seats_router, prefix="/staff-seats", tags=["Staff Seats - ID 과금"])
