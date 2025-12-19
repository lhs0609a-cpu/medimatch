/**
 * 국토교통부 건축물대장 데이터 크롤러
 * - 신규 사용승인 건물 탐지
 * - 근린생활시설 필터링
 */

import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { query } from '../utils/database';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const BUILDING_API_KEY = process.env.BUILDING_API_KEY || '';
const BASE_URL = 'http://apis.data.go.kr/1613000/BldRgstService_v2';

interface Building {
  mgmBldrgstPk: string;  // 관리건축물대장PK
  bldNm: string;         // 건물명
  platPlc: string;       // 대지위치
  newPlatPlc: string;    // 도로명대지위치
  mainPurpsCdNm: string; // 주용도코드명
  etcPurps: string;      // 기타용도
  totArea: string;       // 연면적
  useAprDay: string;     // 사용승인일
  grndFlrCnt: string;    // 지상층수
  ugrndFlrCnt: string;   // 지하층수
}

/**
 * 건축물대장 조회
 */
export async function fetchBuildings(
  sigunguCd: string,
  bjdongCd: string,
  pageNo: number = 1,
  numOfRows: number = 100
): Promise<Building[]> {
  try {
    const response = await axios.get(`${BASE_URL}/getBrTitleInfo`, {
      params: {
        serviceKey: BUILDING_API_KEY,
        sigunguCd,
        bjdongCd,
        pageNo,
        numOfRows,
      },
      timeout: 30000,
    });

    const result = await parseStringPromise(response.data);
    const items = result?.response?.body?.[0]?.items?.[0]?.item || [];

    return items.map((item: any) => ({
      mgmBldrgstPk: item.mgmBldrgstPk?.[0] || '',
      bldNm: item.bldNm?.[0] || '',
      platPlc: item.platPlc?.[0] || '',
      newPlatPlc: item.newPlatPlc?.[0] || '',
      mainPurpsCdNm: item.mainPurpsCdNm?.[0] || '',
      etcPurps: item.etcPurps?.[0] || '',
      totArea: item.totArea?.[0] || '',
      useAprDay: item.useAprDay?.[0] || '',
      grndFlrCnt: item.grndFlrCnt?.[0] || '',
      ugrndFlrCnt: item.ugrndFlrCnt?.[0] || '',
    }));
  } catch (error) {
    logger.error('Failed to fetch buildings', { sigunguCd, bjdongCd, error });
    return [];
  }
}

/**
 * 신규 건물 중 병원 입점 가능 건물 탐지
 */
export async function detectNewMedicalBuildings(): Promise<Building[]> {
  logger.info('Starting new medical building detection');

  const today = new Date();
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthAgoStr = monthAgo.toISOString().split('T')[0].replace(/-/g, '');

  // 서울 주요 구 코드
  const seoulDistricts = [
    { sigunguCd: '11680', bjdongCd: '10300', name: '강남구 역삼동' },
    { sigunguCd: '11680', bjdongCd: '10800', name: '강남구 삼성동' },
    { sigunguCd: '11650', bjdongCd: '10100', name: '서초구 서초동' },
    { sigunguCd: '11710', bjdongCd: '10100', name: '송파구 잠실동' },
    { sigunguCd: '11440', bjdongCd: '10100', name: '마포구 상암동' },
  ];

  const medicalBuildings: Building[] = [];

  // 병원 입점 가능 용도
  const medicalPurposes = [
    '근린생활시설',
    '제1종근린생활시설',
    '제2종근린생활시설',
    '의료시설',
    '업무시설',
  ];

  for (const district of seoulDistricts) {
    logger.info(`Scanning ${district.name}`);

    const buildings = await fetchBuildings(district.sigunguCd, district.bjdongCd);

    for (const building of buildings) {
      // 최근 사용승인 건물 + 병원 입점 가능 용도
      const isRecent = building.useAprDay >= monthAgoStr;
      const isMedicalPurpose = medicalPurposes.some(purpose =>
        building.mainPurpsCdNm?.includes(purpose) || building.etcPurps?.includes(purpose)
      );

      if (isRecent && isMedicalPurpose) {
        medicalBuildings.push(building);
        logger.info('Medical building detected', {
          name: building.bldNm,
          address: building.newPlatPlc || building.platPlc,
          purpose: building.mainPurpsCdNm,
          approved: building.useAprDay,
        });
      }
    }

    // API 호출 간격
    await sleep(500);
  }

  logger.info(`Detected ${medicalBuildings.length} medical buildings`);
  return medicalBuildings;
}

/**
 * 탐지된 건물을 prospect_locations에 저장
 */
export async function saveProspects(buildings: Building[]): Promise<void> {
  logger.info(`Saving ${buildings.length} prospects to database`);

  for (const building of buildings) {
    try {
      // 면적 계산 (㎡)
      const area = parseFloat(building.totArea) || 0;

      // 적합도 점수 계산 (간단한 로직)
      let fitScore = 70;
      if (area >= 100) fitScore += 10;
      if (area >= 200) fitScore += 10;
      if (building.grndFlrCnt && parseInt(building.grndFlrCnt) >= 5) fitScore += 5;

      // 추천 진료과목 결정
      const recommendedDept = calculateRecommendedDept(building);

      await query(`
        INSERT INTO prospect_locations (
          building_id, address, latitude, longitude, type, zoning,
          floor_area, clinic_fit_score, recommended_dept, status, detected_at
        ) VALUES ($1, $2, 0, 0, 'NEW_BUILD', $3, $4, $5, $6, 'NEW', NOW())
        ON CONFLICT (building_id) DO UPDATE SET
          clinic_fit_score = EXCLUDED.clinic_fit_score,
          updated_at = NOW()
      `, [
        building.mgmBldrgstPk,
        building.newPlatPlc || building.platPlc,
        building.mainPurpsCdNm,
        area,
        fitScore,
        recommendedDept,
      ]);

      logger.debug('Prospect saved', { building: building.bldNm });
    } catch (error) {
      logger.error('Failed to save prospect', { building: building.bldNm, error });
    }
  }

  logger.info('Prospects saved successfully');
}

/**
 * 추천 진료과목 계산 (건물 특성 기반)
 */
function calculateRecommendedDept(building: Building): string[] {
  const recommendations: string[] = [];
  const area = parseFloat(building.totArea) || 0;

  // 면적 기반 추천
  if (area >= 200) {
    recommendations.push('정형외과', '재활의학과');
  }
  if (area >= 100 && area < 200) {
    recommendations.push('내과', '이비인후과', '소아청소년과');
  }
  if (area >= 50 && area < 100) {
    recommendations.push('피부과', '안과');
  }

  // 기본 추천
  if (recommendations.length === 0) {
    recommendations.push('내과', '가정의학과');
  }

  return recommendations;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// CLI 실행
if (require.main === module) {
  (async () => {
    logger.info('Building Crawler started');

    const buildings = await detectNewMedicalBuildings();
    await saveProspects(buildings);

    logger.info('Building Crawler finished');
    process.exit(0);
  })();
}
