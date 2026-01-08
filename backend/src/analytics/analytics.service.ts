import { Injectable } from '@nestjs/common';
import {
  getBlogStats,
  getNewsletterStats,
  findRecentActivityLogs,
  findActivityLogs,
  ActivityLogFilters,
} from '../db/queries';

@Injectable()
export class AnalyticsService {
  async getDashboard() {
    try {
      const [blogs, newsletters, recentActivity] = await Promise.all([
        getBlogStats(),
        getNewsletterStats(),
        findRecentActivityLogs(10),
      ]);

      return {
        blogs,
        newsletters,
        recentActivity,
      };
    } catch (error: unknown) {
      const dbError = error as { message?: string; code?: string; detail?: string; hint?: string; stack?: string };
      console.error('Error in getDashboard:', {
        message: dbError.message,
        code: dbError.code,
        detail: dbError.detail,
        hint: dbError.hint,
        stack: dbError.stack,
      });
      throw error;
    }
  }

  async getActivityLogs(
    page: number = 1,
    limit: number = 50,
    filters: ActivityLogFilters = {}
  ) {
    const { logs, total } = await findActivityLogs(page, limit, filters);
    return {
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}

