/**
 * 건강보험심사평가원 데이터 크롤러
 * - 병원 현황 조회
 * - 폐업 병원 탐지
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { query } from '../utils/database';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const HIRA_API_KEY = process.env.HIRA_API_KEY || '';
const BASE_URL = 'http://apis.data.go.kr/B551182/hospInfoServicev2';

interface Hospital {
  yadmNm: string;      // 병원명
  addr: string;        // 주소
  telno: string;       // 전화번호
  XPos: string;        // 경도
  YPos: string;        // 위도
  clCdNm: string;      // 종별코드명
  dgsbjtCdNm: string;  // 진료과목코드명
  estbDd: string;      // 개설일자
  drTotCnt: string;    // 의사총수
  ykiho: string;       // 요양기관번호
}

/**
 * 지역별 병원 목록 조회
 */
export async function fetchHospitalsByRegion(
  sidoCd: string,
  sgguCd?: string,
  pageNo: number = 1,
  numOfRows: number = 100
): Promise<Hospital[]> {
  try {
    const params: any = {
      serviceKey: HIRA_API_KEY,
      sidoCd,
      pageNo,
      numOfRows,
    };

    if (sgguCd) {
      params.sgguCd = sgguCd;
    }

    const response = await axios.get(`${BASE_URL}/getHospBasisList`, {
      params,
      timeout: 30000,
    });

    const result = await parseStringPromise(response.data);
    const items = result?.response?.body?.[0]?.items?.[0]?.item || [];

    return items.map((item: any) => ({
      yadmNm: item.yadmNm?.[0] || '',
      addr: item.addr?.[0] || '',
      telno: item.telno?.[0] || '',
      XPos: item.XPos?.[0] || '',
      YPos: item.YPos?.[0] || '',
      clCdNm: item.clCdNm?.[0] || '',
      dgsbjtCdNm: item.dgsbjtCdNm?.[0] || '',
      estbDd: item.estbDd?.[0] || '',
      drTotCnt: item.drTotCnt?.[0] || '0',
      ykiho: item.ykiho?.[0] || '',
    }));
  } catch (error) {
    logger.error('Failed to fetch hospitals', { sidoCd, sgguCd, error });
    return [];
  }
}

/**
 * 신규 개업 병원 탐지
 */
export async function detectNewHospitals(): Promise<Hospital[]> {
  logger.info('Starting new hospital detection');

  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoStr = weekAgo.toISOString().split('T')[0].replace(/-/g, '');

  // 서울 지역 코드
  const seoulCodes = ['110000']; // 서울시 전체

  const newHospitals: Hospital[] = [];

  for (const sidoCd of seoulCodes) {
    const hospitals = await fetchHospitalsByRegion(sidoCd);

    for (const hospital of hospitals) {
      // 최근 개업한 병원 필터링
      if (hospital.estbDd >= weekAgoStr) {
        newHospitals.push(hospital);
        logger.info('New hospital detected', {
          name: hospital.yadmNm,
          address: hospital.addr,
          established: hospital.estbDd,
        });
      }
    }

    // API 호출 간격
    await sleep(500);
  }

  logger.info(`Detected ${newHospitals.length} new hospitals`);
  return newHospitals;
}

/**
 * 폐업 병원 탐지 (기존 DB와 비교)
 */
export async function detectClosedHospitals(): Promise<any[]> {
  logger.info('Starting closed hospital detection');

  // 기존 DB에 저장된 병원 목록 조회
  const existingResult = await query(`
    SELECT ykiho, name, address, latitude, longitude
    FROM hospitals
    WHERE is_active = true
  `);

  const existingHospitals = new Map(
    existingResult.rows.map((row: any) => [row.ykiho, row])
  );

  // 현재 API에서 병원 목록 조회
  const currentHospitals = await fetchHospitalsByRegion('110000');
  const currentYkihos = new Set(currentHospitals.map(h => h.ykiho));

  const closedHospitals: any[] = [];

  // 기존에 있었는데 현재 없는 병원 = 폐업
  for (const [ykiho, hospital] of existingHospitals) {
    if (!currentYkihos.has(ykiho)) {
      closedHospitals.push(hospital);

      // prospect_locations에 공실로 등록
      await query(`
        INSERT INTO prospect_locations (
          address, latitude, longitude, type, status,
          previous_clinic, clinic_fit_score, detected_at
        ) VALUES ($1, $2, $3, 'VACANCY', 'NEW', $4, 70, NOW())
        ON CONFLICT DO NOTHING
      `, [
        hospital.address,
        hospital.latitude,
        hospital.longitude,
        hospital.name,
      ]);

      logger.info('Closed hospital detected', {
        name: hospital.name,
        address: hospital.address,
      });
    }
  }

  logger.info(`Detected ${closedHospitals.length} closed hospitals`);
  return closedHospitals;
}

/**
 * 병원 데이터 DB 저장
 */
export async function saveHospitals(hospitals: Hospital[]): Promise<void> {
  logger.info(`Saving ${hospitals.length} hospitals to database`);

  for (const hospital of hospitals) {
    try {
      await query(`
        INSERT INTO hospitals (
          ykiho, name, address, phone, latitude, longitude,
          clinic_type, established, doctor_count, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        ON CONFLICT (ykiho) DO UPDATE SET
          name = EXCLUDED.name,
          address = EXCLUDED.address,
          phone = EXCLUDED.phone,
          doctor_count = EXCLUDED.doctor_count,
          updated_at = NOW()
      `, [
        hospital.ykiho,
        hospital.yadmNm,
        hospital.addr,
        hospital.telno,
        parseFloat(hospital.YPos) || 0,
        parseFloat(hospital.XPos) || 0,
        hospital.dgsbjtCdNm,
        hospital.estbDd,
        parseInt(hospital.drTotCnt) || 0,
      ]);
    } catch (error) {
      logger.error('Failed to save hospital', { hospital: hospital.yadmNm, error });
    }
  }

  logger.info('Hospitals saved successfully');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI 실행
if (require.main === module) {
  (async () => {
    logger.info('HIRA Crawler started');

    const hospitals = await fetchHospitalsByRegion('110000');
    logger.info(`Fetched ${hospitals.length} hospitals`);

    await saveHospitals(hospitals);

    const closed = await detectClosedHospitals();
    logger.info(`Found ${closed.length} closed hospitals`);

    process.exit(0);
  })();
}
