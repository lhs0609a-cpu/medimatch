/**
 * 일일 크롤링 스케줄러
 * 매일 새벽 2시에 실행
 */

import cron from 'node-cron';
import { detectNewHospitals, detectClosedHospitals, saveHospitals } from '../hira';
import { detectNewMedicalBuildings, saveProspects } from '../building';
import { sendAlertNotifications } from './notifications';
import logger from '../utils/logger';

/**
 * 일일 크롤링 작업 실행
 */
async function runDailyCrawl(): Promise<void> {
  logger.info('=== Daily Crawl Started ===');
  const startTime = Date.now();

  try {
    // Step 1: 심평원 병원 데이터 수집
    logger.info('Step 1: Fetching hospital data from HIRA');
    const newHospitals = await detectNewHospitals();
    if (newHospitals.length > 0) {
      await saveHospitals(newHospitals);
    }

    // Step 2: 폐업 병원 탐지
    logger.info('Step 2: Detecting closed hospitals');
    const closedHospitals = await detectClosedHospitals();

    // Step 3: 신규 건물 탐지
    logger.info('Step 3: Detecting new medical buildings');
    const newBuildings = await detectNewMedicalBuildings();
    if (newBuildings.length > 0) {
      await saveProspects(newBuildings);
    }

    // Step 4: 알림 발송
    logger.info('Step 4: Sending alert notifications');
    const totalNewProspects = closedHospitals.length + newBuildings.length;
    if (totalNewProspects > 0) {
      await sendAlertNotifications();
    }

    const duration = (Date.now() - startTime) / 1000;
    logger.info('=== Daily Crawl Completed ===', {
      duration: `${duration}s`,
      newHospitals: newHospitals.length,
      closedHospitals: closedHospitals.length,
      newBuildings: newBuildings.length,
    });

  } catch (error) {
    logger.error('Daily crawl failed', { error });
    throw error;
  }
}

/**
 * 스케줄러 시작
 */
function startScheduler(): void {
  logger.info('Starting daily crawler scheduler');

  // 매일 새벽 2시에 실행 (서버 시간 기준)
  cron.schedule('0 2 * * *', async () => {
    logger.info('Scheduled crawl triggered');
    await runDailyCrawl();
  }, {
    timezone: 'Asia/Seoul'
  });

  // 매 6시간마다 폐업 체크 (06:00, 12:00, 18:00, 24:00)
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Checking for closed hospitals');
    await detectClosedHospitals();
    await sendAlertNotifications();
  }, {
    timezone: 'Asia/Seoul'
  });

  logger.info('Scheduler started - Daily crawl at 02:00 KST');
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--now')) {
    // 즉시 실행
    runDailyCrawl()
      .then(() => process.exit(0))
      .catch((error) => {
        logger.error('Crawl failed', { error });
        process.exit(1);
      });
  } else {
    // 스케줄러 시작
    startScheduler();
  }
}

export { runDailyCrawl, startScheduler };
