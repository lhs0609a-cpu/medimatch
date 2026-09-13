"""Dependency-free regression checks: python -m unittest discover -s tests -p '*workflow_unit.py'."""
import unittest
from datetime import datetime, timezone
from app.appointment_workflow import validate_transition, clinic_datetime
import importlib.util
from pathlib import Path
from pydantic import ValidationError

# Load the schema without app.schemas.__init__, which initializes unrelated APIs.
spec = importlib.util.spec_from_file_location("app.schemas.emr_core", Path(__file__).parents[1] / "app/schemas/emr_core.py")
schema = importlib.util.module_from_spec(spec)
spec.loader.exec_module(schema)


class AppointmentWorkflowTests(unittest.TestCase):
    def test_complete_journey(self):
        for current, target in [("SCHEDULED", "CONFIRMED"), ("CONFIRMED", "ARRIVED"), ("ARRIVED", "IN_PROGRESS"), ("IN_PROGRESS", "COMPLETED")]:
            validate_transition(current, target)

    def test_terminal_records_cannot_be_checked_in(self):
        for current in ("CANCELLED", "COMPLETED"):
            with self.subTest(current=current), self.assertRaises(ValueError):
                validate_transition(current, "ARRIVED")

    def test_retries_are_idempotent(self):
        validate_transition("ARRIVED", "ARRIVED")
        validate_transition("COMPLETED", "COMPLETED")

    def test_unknown_status_rejected(self):
        with self.assertRaises(ValueError):
            validate_transition("SCHEDULED", "NOT_A_STATUS")

    def test_korean_date_rollover(self):
        self.assertEqual(clinic_datetime(datetime(2026, 9, 12, 16, tzinfo=timezone.utc)), datetime(2026, 9, 13, 1))

    def test_local_wall_time_preserved(self):
        local = datetime(2026, 9, 13, 9, 30)
        self.assertEqual(clinic_datetime(local), local)

    def test_api_payload_normalizes_utc(self):
        payload = schema.AppointmentCreate(patient_name=" Patient ", start_time="2026-09-13T00:30:00Z")
        self.assertEqual(payload.start_time, datetime(2026, 9, 13, 9, 30))
        self.assertEqual(payload.patient_name, "Patient")

    def test_api_rejects_invalid_duration(self):
        for duration in (0, -15, 481):
            with self.subTest(duration=duration), self.assertRaises(ValidationError):
                schema.AppointmentCreate(patient_name="Patient", start_time="2026-09-13T09:30:00", duration_min=duration)

    def test_api_rejects_blank_name(self):
        with self.assertRaises(ValidationError):
            schema.AppointmentCreate(patient_name="  ", start_time="2026-09-13T09:30:00")

    def test_patch_omission_allowed_but_null_rejected(self):
        self.assertEqual(schema.AppointmentUpdate(memo="changed").model_dump(exclude_unset=True), {"memo": "changed"})
        for field in ("start_time", "duration_min", "status"):
            with self.subTest(field=field), self.assertRaises(ValidationError):
                schema.AppointmentUpdate(**{field: None})
