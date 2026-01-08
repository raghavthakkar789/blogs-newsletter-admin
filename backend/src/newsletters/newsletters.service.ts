import { Injectable, NotFoundException } from '@nestjs/common';
import {
  findNewsletters,
  findNewsletterById,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  bulkUpdateNewsletterStatus,
  NewsletterFilters,
} from '../db/queries';
import { getAdminUserId } from '../utils/adminUser';
import { trackChanges, buildUpdateDataWithHistory } from '../utils/editHistory';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { UpdateStatusDto } from '../common/dto/update-status.dto';
import { BulkUpdateStatusDto } from '../common/dto/bulk-update-status.dto';
import { ContentStatus } from '../types/database';

@Injectable()
export class NewslettersService {
  async findAll(
    page: number = 1,
    limit: number = 20,
    filters: NewsletterFilters = {}
  ) {
    return await findNewsletters(page, limit, filters);
  }

  async findOne(id: string) {
    const newsletter = await findNewsletterById(id);
    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }
    return { newsletter };
  }

  async create(createNewsletterDto: CreateNewsletterDto, userId: string) {
    const newsletter = await createNewsletter({
      title: createNewsletterDto.title,
      content: createNewsletterDto.content,
      tags: createNewsletterDto.tags || [],
      image: createNewsletterDto.image || null,
      createdById: userId,
      status: 'PENDING',
      summary: createNewsletterDto.summary || null,
      category: createNewsletterDto.category || null,
      approvedById: null,
      publishedAt: null,
      editHistory: null,
      lastEditedAt: null,
      lastEditedBy: null,
    });

    const newsletterWithRelations = await findNewsletterById(newsletter.id);
    return { newsletter: newsletterWithRelations };
  }

  async update(id: string, updateNewsletterDto: UpdateNewsletterDto, user: { id: string; firstName: string; lastName: string }) {
    const newsletter = await findNewsletterById(id);
    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    // Track changes for edit history
    const editEntry = trackChanges({
      oldEntity: newsletter,
      newData: updateNewsletterDto,
      fieldsToCheck: ['title', 'content', 'summary', 'category', 'image', 'tags'],
      user,
    });

    // Build update data with edit history
    const updateData = buildUpdateDataWithHistory(
      updateNewsletterDto,
      newsletter.editHistory,
      editEntry,
      'image'
    );

    await updateNewsletter(id, updateData);
    const updatedNewsletter = await findNewsletterById(id);
    return { newsletter: updatedNewsletter };
  }

  async remove(id: string) {
    const newsletter = await findNewsletterById(id);
    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }
    await deleteNewsletter(id);
    return { message: 'Newsletter deleted successfully' };
  }

  async updateStatus(id: string, updateStatusDto: UpdateStatusDto) {
    const newsletter = await findNewsletterById(id);
    if (!newsletter) {
      throw new NotFoundException('Newsletter not found');
    }

    const updateData: {
      status: ContentStatus;
      approvedById: string | null;
      publishedAt?: Date;
    } = {
      status: updateStatusDto.status as ContentStatus,
      approvedById: updateStatusDto.status === 'APPROVED' ? await getAdminUserId() : newsletter.approvedById
    };

    if (updateStatusDto.status === 'APPROVED' && !newsletter.publishedAt) {
      updateData.publishedAt = new Date();
    }

    await updateNewsletter(id, updateData);
    const updatedNewsletter = await findNewsletterById(id);
    return { newsletter: updatedNewsletter };
  }

  async bulkUpdateStatus(bulkUpdateStatusDto: BulkUpdateStatusDto) {
    const approvedById = bulkUpdateStatusDto.status === 'APPROVED' ? await getAdminUserId() : null;
    const publishedAt = bulkUpdateStatusDto.status === 'APPROVED' ? new Date() : null;

    const updatedCount = await bulkUpdateNewsletterStatus(
      bulkUpdateStatusDto.ids,
      bulkUpdateStatusDto.status,
      approvedById,
      publishedAt
    );

    return { updatedCount };
  }
}

