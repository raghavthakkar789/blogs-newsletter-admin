import { Injectable, NotFoundException } from '@nestjs/common';
import {
  findBlogs,
  findBlogById,
  createBlog,
  updateBlog,
  deleteBlog,
  bulkUpdateBlogStatus,
  BlogFilters,
} from '../db/queries';
import { getAdminUserId } from '../utils/adminUser';
import { trackChanges, buildUpdateDataWithHistory } from '../utils/editHistory';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { BulkUpdateStatusDto } from '../common/dto/bulk-update-status.dto';
import { ContentStatus } from '../types/database';

@Injectable()
export class BlogsService {

  async findAll(
    page: number = 1,
    limit: number = 20,
    filters: BlogFilters = {}
  ) {
    return await findBlogs(page, limit, filters);
  }

  async findOne(id: string) {
    const blog = await findBlogById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    return { blog };
  }

  async create(createBlogDto: CreateBlogDto, userId: string) {
    const blog = await createBlog({
      title: createBlogDto.title,
      content: createBlogDto.content,
      tags: createBlogDto.tags || [],
      image: createBlogDto.image || null,
      createdById: userId,
      status: 'PENDING',
      summary: createBlogDto.summary || null,
      category: createBlogDto.category || null,
      author: createBlogDto.author || null,
      approvedById: null,
      publishedAt: null,
      editHistory: null,
      lastEditedAt: null,
      lastEditedBy: null,
    });

    const blogWithRelations = await findBlogById(blog.id);
    return { blog: blogWithRelations };
  }

  async update(id: string, updateBlogDto: UpdateBlogDto, user: { id: string; firstName: string; lastName: string }) {
    const blog = await findBlogById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Track changes for edit history
    const editEntry = trackChanges({
      oldEntity: blog,
      newData: updateBlogDto,
      fieldsToCheck: ['title', 'content', 'summary', 'category', 'author', 'image', 'tags'],
      user,
    });

    // Build update data with edit history
    const updateData = buildUpdateDataWithHistory(
      updateBlogDto,
      blog.editHistory,
      editEntry,
      'image'
    );

    await updateBlog(id, updateData);
    const updatedBlog = await findBlogById(id);
    return { blog: updatedBlog };
  }

  async remove(id: string) {
    const blog = await findBlogById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }
    await deleteBlog(id);
    return { message: 'Blog deleted successfully' };
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const blog = await findBlogById(id);
    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    const updateData: {
      status: ContentStatus;
      approvedById: string | null;
      publishedAt?: Date;
    } = {
      status: updateStatusDto.status as ContentStatus,
      approvedById: updateStatusDto.status === 'APPROVED' ? await getAdminUserId() : blog.approvedById
    };

    if (updateStatusDto.status === 'APPROVED' && !blog.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await updateBlog(id, updateData);
    const updatedBlog = await findBlogById(id);
    return { blog: updatedBlog };
  }

  async bulkUpdateStatus(bulkUpdateStatusDto: BulkUpdateStatusDto) {
    const approvedById = bulkUpdateStatusDto.status === 'APPROVED' ? await getAdminUserId() : null;
    const publishedAt = bulkUpdateStatusDto.status === 'APPROVED' ? new Date() : null;

    const updatedCount = await bulkUpdateBlogStatus(
      bulkUpdateStatusDto.ids,
      bulkUpdateStatusDto.status,
      approvedById,
      publishedAt
    );

    return { updatedCount };
  }
}

