import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '../common/guards/auth.guard';

@Controller('analytics')
@UseGuards(AuthGuard, ThrottlerGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  async getDashboard() {
    return await this.analyticsService.getDashboard();
  }

  @Get('activity-logs')
  async getActivityLogs(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
    @Query('entityType') entityType?: string,
  ) {
    const filters: any = {};
    if (userId) {
      filters.userId = userId;
    }
    if (action) {
      filters.action = action;
    }
    if (entityType) {
      filters.entityType = entityType;
    }

    return await this.analyticsService.getActivityLogs(page, limit, filters);
  }
}

