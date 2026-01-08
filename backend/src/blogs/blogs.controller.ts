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
import { UpdateStatusDto } from './dto/update-status.dto';
import { BulkUpdateStatusDto } from './dto/bulk-update-status.dto';
import { AuthGuard } from '../common/guards/auth.guard';
import { CurrentUser, CurrentUser as CurrentUserType } from '../common/decorators/current-user.decorator';
import { LoggingInterceptor } from '../common/interceptors/logging.interceptor';

@Controller('blogs')
@UseGuards(AuthGuard, ThrottlerGuard)
@UseInterceptors(LoggingInterceptor)
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get('admin/internal')
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('status') status?: string,
    @Query('createdById') createdById?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (status && status !== 'all') {
      filters.status = status as any;
    }
    if (createdById) {
      filters.createdById = createdById;
    }
    if (search) {
      filters.search = search;
    }

    return await this.blogsService.findAll(page, limit, filters);
  }

  @Get('admin/internal/:id')
  async findOne(@Param('id') id: string) {
    return await this.blogsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createBlogDto: CreateBlogDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    const { getAdminUserId } = await import('../utils/adminUser');
    const adminId = await getAdminUserId();
    return await this.blogsService.create(createBlogDto, adminId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBlogDto: UpdateBlogDto,
    @CurrentUser() user: CurrentUserType,
  ) {
    return await this.blogsService.update(id, updateBlogDto, user);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.blogsService.remove(id);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return await this.blogsService.updateStatus(id, updateStatusDto);
  }

  @Patch('bulk/status')
  async bulkUpdateStatus(@Body() bulkUpdateStatusDto: BulkUpdateStatusDto) {
    return await this.blogsService.bulkUpdateStatus(bulkUpdateStatusDto);
  }

}

