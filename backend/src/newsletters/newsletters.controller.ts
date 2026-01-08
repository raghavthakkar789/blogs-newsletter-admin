import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { NewslettersService } from './newsletters.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { BulkUpdateStatusDto } from '../common/dto/bulk-update-status.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { ContentStatus } from '../types/database';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

@Controller('newsletters')
@UseInterceptors(LoggingInterceptor)
export class NewslettersController {
  constructor(private readonly newslettersService: NewslettersService) {}

  @Get()
  @UseGuards(ThrottlerGuard)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('createdById') createdById?: string,
    @Query('search') search?: string,
  ) {
    const filters: { status?: ContentStatus; createdById?: string; search?: string } = {};
    if (status && status !== 'all') {
      filters.status = status as ContentStatus;
    }
    if (createdById) {
      filters.createdById = createdById;
    }
    if (search) {
      filters.search = search;
    }

    return await this.newslettersService.findAll(page, limit, filters);
  }

  @Get(':id')
  @UseGuards(ThrottlerGuard)
  async findOne(@Param('id') id: string) {
    return await this.newslettersService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, ThrottlerGuard)
  async create(
    @Body() createNewsletterDto: CreateNewsletterDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const { getAdminUserId } = await import('../utils/adminUser');
    const adminId = await getAdminUserId();
    return await this.newslettersService.create(createNewsletterDto, adminId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async update(
    @Param('id') id: string,
    @Body() updateNewsletterDto: UpdateNewsletterDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return await this.newslettersService.update(id, updateNewsletterDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async remove(@Param('id') id: string) {
    return await this.newslettersService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return await this.newslettersService.updateStatus(id, updateStatusDto);
  }

  @Patch('bulk/status')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async bulkUpdateStatus(@Body() bulkUpdateStatusDto: BulkUpdateStatusDto) {
    return await this.newslettersService.bulkUpdateStatus(bulkUpdateStatusDto);
  }

}

