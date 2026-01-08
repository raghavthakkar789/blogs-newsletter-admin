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
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { BulkUpdateStatusDto } from '../common/dto/bulk-update-status.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { ContentStatus } from '../types/database';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

@Controller('blogs')
@UseInterceptors(LoggingInterceptor)
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

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

    return await this.blogsService.findAll(page, limit, filters);
  }

  @Get(':id')
  @UseGuards(ThrottlerGuard)
  async findOne(@Param('id') id: string) {
    return await this.blogsService.findOne(id);
  }

  @Post()
  @UseGuards(AuthGuard, ThrottlerGuard)
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const { getAdminUserId } = await import('../utils/adminUser');
    const adminId = await getAdminUserId();
    return await this.blogsService.create(createBlogDto, adminId);
  }

  @Patch(':id')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return await this.blogsService.update(id, updateBlogDto, user);
  }

  @Delete(':id')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async remove(@Param('id') id: string) {
    return await this.blogsService.remove(id);
  }

  @Patch(':id/status')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return await this.blogsService.updateStatus(id, updateStatusDto);
  }

  @Patch('bulk/status')
  @UseGuards(AuthGuard, ThrottlerGuard)
  async bulkUpdateStatus(@Body() bulkUpdateStatusDto: BulkUpdateStatusDto) {
    return await this.blogsService.bulkUpdateStatus(bulkUpdateStatusDto);
  }

}

