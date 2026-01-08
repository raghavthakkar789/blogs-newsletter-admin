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
    } catch (error: any) {
      console.error('Error in getDashboard:', {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: error.stack,
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

