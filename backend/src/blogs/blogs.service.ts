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
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { BulkUpdateStatusDto } from './dto/bulk-update-status.dto';

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
    const changes: string[] = [];
    const fieldsToCheck = ['title', 'content', 'summary', 'category', 'author', 'image', 'tags'];

    fieldsToCheck.forEach(field => {
      if (field === 'tags') {
        const oldTags = JSON.stringify(blog.tags || []);
        const newTags = JSON.stringify(updateBlogDto.tags || []);
        if (oldTags !== newTags) {
          changes.push(field);
        }
      } else if (updateBlogDto[field as keyof typeof updateBlogDto] !== undefined && 
                 updateBlogDto[field as keyof typeof updateBlogDto] !== blog[field as keyof typeof blog]) {
        changes.push(field);
      }
    });

    // Build edit history entry
    const userName = `${user.firstName} ${user.lastName}`;
    const editEntry = {
      userId: user.id,
      userName,
      editedAt: new Date().toISOString(),
      changes
    };

    // Get existing edit history
    const existingHistory = (blog.editHistory as any[]) || [];
    const updatedHistory = [...existingHistory, editEntry];

    // Prepare update data
    const updateData: any = {
      ...updateBlogDto,
      image: updateBlogDto.image === '' ? null : updateBlogDto.image,
      lastEditedBy: userName,
      lastEditedAt: new Date(),
      editHistory: updatedHistory
    };

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

    const updateData: any = {
      status: updateStatusDto.status,
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

