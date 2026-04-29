"""EMR 핵심 모듈 Pydantic 스키마: visit/prescription/appointment/bill"""
from datetime import datetime, date
from typing import List, Optional, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict


# ────────────────────────────────────────────
#  Visit (전자차트)
# ────────────────────────────────────────────
class DiagnosisIn(BaseModel):
    code: str
    name: str
    is_primary: bool = False
    note: Optional[str] = None


class DiagnosisOut(DiagnosisIn):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ProcedureIn(BaseModel):
    code: str
    name: str
    category: Optional[str] = None
    quantity: int = 1
    unit_price: int = 0
    total_price: int = 0
    insurance_covered: bool = True
    note: Optional[str] = None


class ProcedureOut(ProcedureIn):
    id: int
    model_config = ConfigDict(from_attributes=True)


class VisitCreate(BaseModel):
    patient_id: Optional[UUID] = None
    chart_no: Optional[str] = None
    visit_date: date
    visit_type: str = "INITIAL"
    chief_complaint: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    vital_systolic: Optional[int] = None
    vital_diastolic: Optional[int] = None
    vital_hr: Optional[int] = None
    vital_temp: Optional[float] = None
    vital_spo2: Optional[int] = None
    vital_weight: Optional[float] = None
    vital_height: Optional[float] = None
    doctor_name: Optional[str] = None
    next_visit_date: Optional[date] = None
    visit_notes: Optional[str] = None
    voice_transcript: Optional[str] = None
    diagnoses: List[DiagnosisIn] = []
    procedures: List[ProcedureIn] = []


class VisitUpdate(BaseModel):
    chief_complaint: Optional[str] = None
    subjective: Optional[str] = None
    objective: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    vital_systolic: Optional[int] = None
    vital_diastolic: Optional[int] = None
    vital_hr: Optional[int] = None
    vital_temp: Optional[float] = None
    vital_spo2: Optional[int] = None
    vital_weight: Optional[float] = None
    vital_height: Optional[float] = None
    next_visit_date: Optional[date] = None
    visit_notes: Optional[str] = None
    voice_transcript: Optional[str] = None
    status: Optional[str] = None
    diagnoses: Optional[List[DiagnosisIn]] = None
    procedures: Optional[List[ProcedureIn]] = None


class VisitOut(BaseModel):
    id: UUID
    patient_id: Optional[UUID]
    chart_no: Optional[str]
    visit_no: str
    visit_date: date
    visit_type: str
    chief_complaint: Optional[str]
    subjective: Optional[str]
    objective: Optional[str]
    assessment: Optional[str]
    plan: Optional[str]
    vital_systolic: Optional[int]
    vital_diastolic: Optional[int]
    vital_hr: Optional[int]
    vital_temp: Optional[float]
    vital_spo2: Optional[int]
    vital_weight: Optional[float]
    vital_height: Optional[float]
    vital_bmi: Optional[float]
    doctor_name: Optional[str]
    status: str
    duration_min: Optional[int]
    next_visit_date: Optional[date]
    visit_notes: Optional[str]
    voice_transcript: Optional[str]
    ai_suggestions: List[Dict[str, Any]] = []
    diagnoses: List[DiagnosisOut] = []
    procedures: List[ProcedureOut] = []
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)


class VisitListItem(BaseModel):
    id: UUID
    patient_id: Optional[UUID]
    chart_no: Optional[str]
    visit_no: str
    visit_date: date
    visit_type: str
    chief_complaint: Optional[str]
    primary_diagnosis: Optional[str] = None
    doctor_name: Optional[str]
    status: str
    procedure_count: int = 0
    total_amount: int = 0
    model_config = ConfigDict(from_attributes=True)


# ────────────────────────────────────────────
#  Prescription (처방전)
# ────────────────────────────────────────────
class PrescriptionItemIn(BaseModel):
    drug_code: Optional[str] = None
    drug_name: str
    ingredient: Optional[str] = None
    dose_per_time: float = 1.0
    dose_unit: str = "정"
    frequency_per_day: int = 1
    duration_days: int = 1
    total_quantity: float = 1
    unit_price: int = 0
    total_price: int = 0
    usage_note: Optional[str] = None


class PrescriptionItemOut(PrescriptionItemIn):
    id: int
    warning: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class PrescriptionCreate(BaseModel):
    visit_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    prescribed_date: date
    doctor_name: Optional[str] = None
    pharmacy_name: Optional[str] = None
    duration_days: Optional[int] = None
    patient_note: Optional[str] = None
    items: List[PrescriptionItemIn] = []


class PrescriptionOut(BaseModel):
    id: UUID
    visit_id: Optional[UUID]
    patient_id: Optional[UUID]
    prescription_no: str
    prescribed_date: date
    doctor_name: Optional[str]
    pharmacy_name: Optional[str]
    status: str
    duration_days: Optional[int]
    total_amount: int
    dur_warnings: List[Dict[str, Any]] = []
    patient_note: Optional[str]
    items: List[PrescriptionItemOut] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ────────────────────────────────────────────
#  Appointment (예약)
# ────────────────────────────────────────────
class AppointmentCreate(BaseModel):
    patient_id: Optional[UUID] = None
    patient_name: str
    patient_phone: Optional[str] = None
    patient_birth: Optional[date] = None
    doctor_name: Optional[str] = None
    start_time: datetime
    duration_min: int = 15
    appointment_type: str = "INITIAL"
    chief_complaint: Optional[str] = None
    memo: Optional[str] = None
    channel: str = "PHONE"


class AppointmentUpdate(BaseModel):
    start_time: Optional[datetime] = None
    duration_min: Optional[int] = None
    status: Optional[str] = None
    chief_complaint: Optional[str] = None
    memo: Optional[str] = None
    cancelled_reason: Optional[str] = None


class AppointmentOut(BaseModel):
    id: UUID
    patient_id: Optional[UUID]
    patient_name: str
    patient_phone: Optional[str]
    patient_birth: Optional[date]
    doctor_name: Optional[str]
    start_time: datetime
    end_time: datetime
    duration_min: int
    status: str
    appointment_type: str
    chief_complaint: Optional[str]
    memo: Optional[str]
    channel: Optional[str]
    arrived_at: Optional[datetime]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


# ────────────────────────────────────────────
#  Bill (수납/청구서)
# ────────────────────────────────────────────
class BillItemIn(BaseModel):
    item_type: str
    code: Optional[str] = None
    name: str
    quantity: int = 1
    unit_price: int = 0
    insurance_covered: bool = True
    copay_rate: float = 0.30


class BillItemOut(BillItemIn):
    id: int
    total_price: int
    model_config = ConfigDict(from_attributes=True)


class BillCreate(BaseModel):
    visit_id: Optional[UUID] = None
    patient_id: Optional[UUID] = None
    bill_date: date
    discount_amount: int = 0
    memo: Optional[str] = None
    items: List[BillItemIn] = []


class PaymentIn(BaseModel):
    amount: int
    method: str = "CARD"
    transaction_id: Optional[str] = None
    card_last4: Optional[str] = None
    card_company: Optional[str] = None
    received_by: Optional[str] = None
    note: Optional[str] = None


class PaymentOut(PaymentIn):
    id: int
    received_at: datetime
    is_refund: bool
    model_config = ConfigDict(from_attributes=True)


class BillOut(BaseModel):
    id: UUID
    visit_id: Optional[UUID]
    patient_id: Optional[UUID]
    bill_no: str
    bill_date: date
    subtotal: int
    insurance_amount: int
    patient_amount: int
    non_covered_amount: int
    discount_amount: int
    final_amount: int
    paid_amount: int
    balance: int
    status: str
    issued_at: Optional[datetime]
    completed_at: Optional[datetime]
    memo: Optional[str]
    items: List[BillItemOut] = []
    payments: List[PaymentOut] = []
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)
