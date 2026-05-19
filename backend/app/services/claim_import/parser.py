"""
청구 파일 파서 — CSV/XLSX/심평원 EDI .txt → (헤더, 행 dict).

환자 임포터의 parser와 거의 동일. 추가: 심평원 EDI 텍스트 (HD/CD/SE 세그먼트).
"""
from __future__ import annotations
import csv
import io
import re
from dataclasses import dataclass, field
from typing import Any

import pandas as pd


@dataclass
class ParsedClaimFile:
    headers: list[str]
    rows: list[dict[str, Any]]
    encoding_used: str | None = None
    sheet_used: str | None = None
    format_detected: str = "unknown"   # "csv" | "xlsx" | "edi_text"
    warnings: list[str] = field(default_factory=list)


_ENCODINGS_TRY = ("utf-8-sig", "utf-8", "cp949", "euc-kr", "latin-1")


def _decode(raw: bytes) -> tuple[str, str]:
    for enc in _ENCODINGS_TRY:
        try:
            return raw.decode(enc), enc
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1", errors="replace"), "latin-1"


def _sniff_delimiter(sample: str) -> str:
    try:
        d = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        return d.delimiter
    except csv.Error:
        first = sample.splitlines()[0] if sample else ""
        cands = {d: first.count(d) for d in ",;\t|"}
        return max(cands, key=cands.get) if max(cands.values()) > 0 else ","


# 심평원 EDI 메시지의 흔한 세그먼트 패턴 (간이 — 실제는 IFD 표준이지만 export는 CSV-ish가 대부분)
_EDI_SEG_RE = re.compile(r"^(HD|CD|SE|PI|MT|DI|RX|JX|TX|RE)\d?\b")


def _looks_like_edi(text: str) -> bool:
    """첫 50줄에 EDI 세그먼트 패턴이 30% 이상이면 EDI로 판정."""
    lines = [ln.strip() for ln in text.splitlines()[:50] if ln.strip()]
    if not lines:
        return False
    hits = sum(1 for ln in lines if _EDI_SEG_RE.match(ln))
    return hits / len(lines) >= 0.3


def _parse_edi_text(text: str) -> tuple[list[str], list[dict[str, Any]]]:
    """심평원 EDI export(텍스트) → 행 dict 리스트.

    실제 의원에서 export되는 형태가 워낙 제각각이라 *간이 파서*:
    - 한 환자 단위 (PI 세그먼트 시작) 모았다가, CD(상병)/MT(수가)/RX(약제) 세그먼트를
      행별로 펼침. 각 행에 환자 chart_no, 진료일자, 코드, 명칭 등이 채워짐.
    - 표준 IFD 메시지면 별도 라이브러리(예: pyedi) 필요 — 그건 후속.
    """
    headers = [
        "patient_chart_no", "patient_name", "service_date",
        "dx_code", "dx_name",
        "item_code", "item_name", "item_type",
        "quantity", "unit_price", "total_price",
    ]
    rows: list[dict[str, Any]] = []
    current_patient: dict[str, str] = {}
    current_visit_date: str = ""
    current_dx_code: str = ""
    current_dx_name: str = ""

    for ln in text.splitlines():
        s = ln.strip()
        if not s:
            continue
        parts = re.split(r"[\t|;,]", s)
        seg = parts[0].upper() if parts else ""

        if seg.startswith("PI"):  # 환자 정보
            current_patient = {
                "chart_no": parts[1] if len(parts) > 1 else "",
                "name": parts[2] if len(parts) > 2 else "",
            }
            current_visit_date = parts[3] if len(parts) > 3 else current_visit_date
        elif seg.startswith("CD"):  # 상병
            current_dx_code = parts[1] if len(parts) > 1 else ""
            current_dx_name = parts[2] if len(parts) > 2 else ""
        elif seg.startswith(("MT", "RX", "JX", "TX", "DI")):
            # 항목 (수기료/약제/주사/검사/영상)
            type_map = {"MT": "TREATMENT", "RX": "MEDICATION", "JX": "INJECTION", "TX": "TEST", "DI": "IMAGING"}
            rows.append({
                "patient_chart_no": current_patient.get("chart_no", ""),
                "patient_name": current_patient.get("name", ""),
                "service_date": current_visit_date,
                "dx_code": current_dx_code,
                "dx_name": current_dx_name,
                "item_code": parts[1] if len(parts) > 1 else "",
                "item_name": parts[2] if len(parts) > 2 else "",
                "item_type": type_map.get(seg[:2], ""),
                "quantity": parts[3] if len(parts) > 3 else "1",
                "unit_price": parts[4] if len(parts) > 4 else "0",
                "total_price": parts[5] if len(parts) > 5 else "0",
            })
    return headers, rows


def parse_claim_file(filename: str, raw: bytes, *, max_rows: int = 50000) -> ParsedClaimFile:
    """파일명+바이트 → ParsedClaimFile."""
    name = (filename or "").lower()
    warnings: list[str] = []

    if name.endswith((".csv", ".tsv", ".txt")):
        text, enc = _decode(raw)

        # EDI 판정 (.txt + EDI 세그먼트 패턴)
        if name.endswith(".txt") and _looks_like_edi(text):
            headers, rows = _parse_edi_text(text)
            if len(rows) > max_rows:
                warnings.append(f"행이 {len(rows)}건 — 처음 {max_rows}건만 사용합니다.")
                rows = rows[:max_rows]
            return ParsedClaimFile(
                headers=headers, rows=rows,
                encoding_used=enc, format_detected="edi_text", warnings=warnings,
            )

        # 일반 CSV/TSV
        sample = text[:8192]
        delim = "\t" if name.endswith(".tsv") else _sniff_delimiter(sample)
        reader = csv.reader(io.StringIO(text), delimiter=delim)
        all_rows = list(reader)
        if not all_rows:
            return ParsedClaimFile(
                headers=[], rows=[], encoding_used=enc,
                format_detected="csv", warnings=["빈 파일입니다."],
            )
        headers = [str(h).strip() for h in all_rows[0]]
        body = all_rows[1:]
        if len(body) > max_rows:
            warnings.append(f"행이 {len(body)}건 — 처음 {max_rows}건만 사용합니다.")
            body = body[:max_rows]
        rows = [
            {headers[i]: (r[i] if i < len(r) else "") for i in range(len(headers))}
            for r in body
        ]
        return ParsedClaimFile(
            headers=headers, rows=rows,
            encoding_used=enc, format_detected="csv", warnings=warnings,
        )

    if name.endswith((".xlsx", ".xls", ".xlsm")):
        engine = "openpyxl" if not name.endswith(".xls") else None
        try:
            xl = pd.ExcelFile(io.BytesIO(raw), engine=engine)
        except Exception as e:
            return ParsedClaimFile(
                headers=[], rows=[],
                format_detected="xlsx", warnings=[f"엑셀 파싱 실패: {e}"],
            )
        # 행이 가장 많은 시트
        best_sheet = xl.sheet_names[0]
        best_score = -1
        for s in xl.sheet_names:
            try:
                df_peek = xl.parse(s, nrows=5)
                score = df_peek.shape[1] * 10 + len(df_peek.dropna(how="all"))
                if score > best_score:
                    best_score = score
                    best_sheet = s
            except Exception:
                continue
        df = xl.parse(best_sheet)
        df = df.dropna(how="all").dropna(how="all", axis=1)
        if df.empty:
            return ParsedClaimFile(
                headers=[], rows=[], sheet_used=best_sheet,
                format_detected="xlsx", warnings=["시트가 비어있습니다."],
            )
        if len(df) > max_rows:
            warnings.append(f"행이 {len(df)}건 — 처음 {max_rows}건만 사용합니다.")
            df = df.head(max_rows)
        headers = [str(c).strip() for c in df.columns]
        df = df.where(pd.notna(df), None)
        rows = [{str(k).strip(): v for k, v in rec.items()} for rec in df.to_dict(orient="records")]
        return ParsedClaimFile(
            headers=headers, rows=rows,
            sheet_used=best_sheet, format_detected="xlsx", warnings=warnings,
        )

    return ParsedClaimFile(
        headers=[], rows=[], format_detected="unknown",
        warnings=[f"지원하지 않는 형식: {filename}"],
    )
