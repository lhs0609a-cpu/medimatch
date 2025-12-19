/**
 * 크롤러 알림 발송 모듈
 * - 새로운 프로스펙트 발견시 사용자에게 알림
 * - 백엔드 API를 통해 알림 발송
 */

import axios from 'axios';
import { query } from '../utils/database';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:8000/api/v1';
const API_KEY = process.env.CRAWLER_API_KEY || '';

interface UserAlert {
  id: number;
  user_id: number;
  email: string;
  phone: string;
  name: string;
  region_filter: string | null;
  type_filter: string | null;
  min_score: number;
  notify_email: boolean;
  notify_push: boolean;
}

interface Prospect {
  id: number;
  address: string;
  type: string;
  clinic_fit_score: number;
  recommended_dept: string[];
}

/**
 * 알림 발송 메인 함수
 */
export async function sendAlertNotifications(): Promise<void> {
  logger.info('Starting alert notification process');

  try {
    // 최근 1시간 내 생성된 프로스펙트 조회
    const recentProspects = await getRecentProspects();

    if (recentProspects.length === 0) {
      logger.info('No recent prospects found');
      return;
    }

    logger.info(`Found ${recentProspects.length} recent prospects`);

    // 활성화된 알림 설정 조회
    const activeAlerts = await getActiveAlerts();

    if (activeAlerts.length === 0) {
      logger.info('No active alerts configured');
      return;
    }

    logger.info(`Found ${activeAlerts.length} active alert configurations`);

    // 각 알림 설정에 대해 매칭되는 프로스펙트 확인 및 알림 발송
    let sentCount = 0;

    for (const alert of activeAlerts) {
      const matchingProspects = filterProspectsForAlert(recentProspects, alert);

      if (matchingProspects.length > 0) {
        await sendNotificationsToUser(alert, matchingProspects);
        sentCount++;
      }
    }

    logger.info(`Sent notifications to ${sentCount} users`);

  } catch (error) {
    logger.error('Failed to send alert notifications', { error });
    throw error;
  }
}

/**
 * 최근 생성된 프로스펙트 조회
 */
async function getRecentProspects(): Promise<Prospect[]> {
  const result = await query(`
    SELECT id, address, type, clinic_fit_score, recommended_dept
    FROM prospect_locations
    WHERE created_at > NOW() - INTERVAL '1 hour'
      AND status = 'NEW'
    ORDER BY clinic_fit_score DESC
    LIMIT 100
  `);

  return result.rows.map((row: any) => ({
    id: row.id,
    address: row.address,
    type: row.type,
    clinic_fit_score: row.clinic_fit_score,
    recommended_dept: row.recommended_dept || [],
  }));
}

/**
 * 활성화된 알림 설정 조회
 */
async function getActiveAlerts(): Promise<UserAlert[]> {
  const result = await query(`
    SELECT
      ua.id,
      ua.user_id,
      u.email,
      u.phone,
      u.name,
      ua.region_filter,
      ua.type_filter,
      ua.min_score,
      ua.notify_email,
      ua.notify_push
    FROM user_alerts ua
    JOIN users u ON ua.user_id = u.id
    WHERE ua.is_active = true
      AND (ua.notify_email = true OR ua.notify_push = true)
  `);

  return result.rows;
}

/**
 * 알림 설정에 맞는 프로스펙트 필터링
 */
function filterProspectsForAlert(prospects: Prospect[], alert: UserAlert): Prospect[] {
  return prospects.filter(prospect => {
    // 최소 점수 필터
    if (alert.min_score && prospect.clinic_fit_score < alert.min_score) {
      return false;
    }

    // 유형 필터
    if (alert.type_filter) {
      const types = alert.type_filter.split(',').map(t => t.trim());
      if (!types.includes(prospect.type)) {
        return false;
      }
    }

    // 지역 필터 (주소에 포함되어 있는지 확인)
    if (alert.region_filter) {
      const regions = alert.region_filter.split(',').map(r => r.trim());
      const matchesRegion = regions.some(region =>
        prospect.address.includes(region)
      );
      if (!matchesRegion) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 사용자에게 알림 발송
 */
async function sendNotificationsToUser(alert: UserAlert, prospects: Prospect[]): Promise<void> {
  const topProspect = prospects[0];

  try {
    // 이메일 알림
    if (alert.notify_email && alert.email) {
      await sendEmailNotification(alert, prospects);
    }

    // 푸시 알림
    if (alert.notify_push) {
      await sendPushNotification(alert, topProspect);
    }

    // 알림 발송 기록
    await logNotification(alert.user_id, prospects.length);

    logger.info(`Sent notifications to user ${alert.user_id}`, {
      email: alert.notify_email,
      push: alert.notify_push,
      prospects: prospects.length,
    });

  } catch (error) {
    logger.error(`Failed to send notification to user ${alert.user_id}`, { error });
  }
}

/**
 * 이메일 알림 발송 (백엔드 API 호출)
 */
async function sendEmailNotification(alert: UserAlert, prospects: Prospect[]): Promise<void> {
  const subject = `[MediMatch] 새로운 입지 ${prospects.length}건 발견!`;
  const topProspect = prospects[0];

  try {
    await axios.post(`${API_BASE_URL}/notifications/email`, {
      email: alert.email,
      subject,
      template: 'new_prospect',
      context: {
        user_name: alert.name,
        address: topProspect.address,
        score: topProspect.clinic_fit_score,
        prospect_id: topProspect.id,
        total_count: prospects.length,
      }
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    logger.debug(`Email notification sent to ${alert.email}`);

  } catch (error) {
    logger.error(`Email notification failed for ${alert.email}`, { error });
  }
}

/**
 * 푸시 알림 발송 (백엔드 API 호출)
 */
async function sendPushNotification(alert: UserAlert, prospect: Prospect): Promise<void> {
  try {
    await axios.post(`${API_BASE_URL}/notifications/push`, {
      user_id: alert.user_id,
      title: '새로운 입지 발견!',
      body: `${prospect.address} - 적합도 ${prospect.clinic_fit_score}점`,
      data: {
        prospect_id: prospect.id,
        type: prospect.type,
      }
    }, {
      headers: {
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    logger.debug(`Push notification sent to user ${alert.user_id}`);

  } catch (error) {
    logger.error(`Push notification failed for user ${alert.user_id}`, { error });
  }
}

/**
 * 알림 발송 기록
 */
async function logNotification(userId: number, prospectCount: number): Promise<void> {
  try {
    await query(`
      INSERT INTO notification_logs (user_id, type, prospect_count, sent_at)
      VALUES ($1, 'CRAWLER_ALERT', $2, NOW())
    `, [userId, prospectCount]);
  } catch (error) {
    logger.warn('Failed to log notification', { error });
  }
}

/**
 * 일일 다이제스트 발송
 */
export async function sendDailyDigest(): Promise<void> {
  logger.info('Starting daily digest');

  try {
    // 오늘 생성된 프로스펙트 수 조회
    const countResult = await query(`
      SELECT COUNT(*) as count
      FROM prospect_locations
      WHERE created_at > NOW() - INTERVAL '1 day'
    `);
    const newProspectCount = parseInt(countResult.rows[0]?.count || '0');

    if (newProspectCount === 0) {
      logger.info('No new prospects today, skipping digest');
      return;
    }

    // 다이제스트를 받을 사용자 조회
    const usersResult = await query(`
      SELECT DISTINCT u.id, u.email, u.name
      FROM users u
      JOIN user_alerts ua ON u.id = ua.user_id
      WHERE ua.is_active = true
        AND ua.notify_email = true
    `);

    const users = usersResult.rows;
    logger.info(`Sending daily digest to ${users.length} users`);

    for (const user of users) {
      try {
        await axios.post(`${API_BASE_URL}/notifications/email`, {
          email: user.email,
          subject: `[MediMatch] 오늘의 새로운 기회 ${newProspectCount}건`,
          template: 'daily_digest',
          context: {
            user_name: user.name,
            new_prospects: newProspectCount,
            date: new Date().toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          }
        }, {
          headers: {
            'X-API-Key': API_KEY,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });
      } catch (error) {
        logger.error(`Daily digest failed for ${user.email}`, { error });
      }
    }

    logger.info('Daily digest completed');

  } catch (error) {
    logger.error('Failed to send daily digest', { error });
    throw error;
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--digest')) {
    sendDailyDigest()
      .then(() => process.exit(0))
      .catch((error) => {
        logger.error('Digest failed', { error });
        process.exit(1);
      });
  } else {
    sendAlertNotifications()
      .then(() => process.exit(0))
      .catch((error) => {
        logger.error('Alerts failed', { error });
        process.exit(1);
      });
  }
}
