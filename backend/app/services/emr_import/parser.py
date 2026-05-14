"""
파일 파서 — CSV/XLSX/XLS을 (헤더, 행 dict 리스트)로 정규화.

인코딩: UTF-8 / CP949 / EUC-KR 자동 감지 (한국 EMR 엑셀 export는 CP949 빈번).
크기: 베타 한도 내에서 안전. 매우 큰 파일은 별도 백그라운드 처리 권장 — 여기선 동기.
"""
from __future__ import annotations
import csv
import io
from dataclasses import dataclass, field
from typing import Any

import pandas as pd


@dataclass
class ParsedFile:
    headers: list[str]
    rows: list[dict[str, Any]]   # {원본 헤더: 원본 값}
    encoding_used: str | None = None
    sheet_used: str | None = None
    warnings: list[str] = field(default_factory=list)


_ENCODINGS_TRY = ("utf-8-sig", "utf-8", "cp949", "euc-kr", "latin-1")


def _decode_csv(raw: bytes) -> tuple[str, str]:
    """CSV bytes → (텍스트, 사용된 인코딩). 실패시 latin-1 fallback."""
    for enc in _ENCODINGS_TRY:
        try:
            return raw.decode(enc), enc
        except UnicodeDecodeError:
            continue
    return raw.decode("latin-1", errors="replace"), "latin-1"


def _sniff_delimiter(sample: str) -> str:
    """CSV 구분자 추정 — , ; \\t | 중 하나."""
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        return dialect.delimiter
    except csv.Error:
        # 첫 줄에서 가장 많이 나오는 후보 선택
        first_line = sample.splitlines()[0] if sample else ""
        candidates = {d: first_line.count(d) for d in ",;\t|"}
        return max(candidates, key=candidates.get) if max(candidates.values()) > 0 else ","


def parse_file(filename: str, raw: bytes, *, max_rows: int = 5000) -> ParsedFile:
    """파일명 + 바이트 → ParsedFile.

    - CSV: 인코딩 + 구분자 자동 감지
    - XLSX/XLS: 첫 시트 (또는 가장 행 많은 시트)

    max_rows 초과 시 잘라내고 warning 추가 (베타 한도와 별개로 파서 자체 가드).
    """
    name = (filename or "").lower()
    warnings: list[str] = []

    if name.endswith(".csv") or name.endswith(".tsv") or name.endswith(".txt"):
        text, enc = _decode_csv(raw)
        sample = text[:8192]
        delim = "\t" if name.endswith(".tsv") else _sniff_delimiter(sample)
        reader = csv.reader(io.StringIO(text), delimiter=delim)
        all_rows = list(reader)
        if not all_rows:
            return ParsedFile(headers=[], rows=[], encoding_used=enc, warnings=["빈 파일입니다."])
        headers = [str(h).strip() for h in all_rows[0]]
        body = all_rows[1:]
        if len(body) > max_rows:
            warnings.append(f"행이 {len(body)}건 — 처음 {max_rows}건만 사용합니다.")
            body = body[:max_rows]
        rows = [
            {headers[i]: (r[i] if i < len(r) else "") for i in range(len(headers))}
            for r in body
        ]
        return ParsedFile(headers=headers, rows=rows, encoding_used=enc, warnings=warnings)

    if name.endswith(".xlsx") or name.endswith(".xls") or name.endswith(".xlsm"):
        engine = "openpyxl" if not name.endswith(".xls") else None
        try:
            xl = pd.ExcelFile(io.BytesIO(raw), engine=engine)
        except Exception as e:
            return ParsedFile(headers=[], rows=[], warnings=[f"엑셀 파싱 실패: {e}"])
        # 가장 행 많은 시트 선택 (대시보드 시트 우회)
        best_sheet = xl.sheet_names[0]
        best_count = -1
        for s in xl.sheet_names:
            try:
                cnt = xl.parse(s, nrows=0).shape[1]  # 컬럼 수만 빠르게
                df_peek = xl.parse(s, nrows=5)
                # 행이 의미있게 있는지: 컬럼 5개 이상
                score = df_peek.shape[1] * 10 + len(df_peek.dropna(how="all"))
                if score > best_count:
                    best_count = score
                    best_sheet = s
            except Exception:
                continue
        df = xl.parse(best_sheet)
        # 완전 빈 행/열 제거
        df = df.dropna(how="all").dropna(how="all", axis=1)
        if df.empty:
            return ParsedFile(headers=[], rows=[], sheet_used=best_sheet, warnings=["시트가 비어있습니다."])
        if len(df) > max_rows:
            warnings.append(f"행이 {len(df)}건 — 처음 {max_rows}건만 사용합니다.")
            df = df.head(max_rows)
        headers = [str(c).strip() for c in df.columns]
        # NaN을 빈 문자열로
        df = df.where(pd.notna(df), None)
        rows = []
        for rec in df.to_dict(orient="records"):
            rows.append({str(k).strip(): v for k, v in rec.items()})
        return ParsedFile(
            headers=headers, rows=rows,
            sheet_used=best_sheet, warnings=warnings,
        )

    return ParsedFile(headers=[], rows=[], warnings=[f"지원하지 않는 형식: {filename}"])
