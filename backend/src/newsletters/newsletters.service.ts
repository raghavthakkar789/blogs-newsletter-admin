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
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { UpdateNewsletterDto } from './dto/update-newsletter.dto';
import { UpdateStatusDto } from '../blogs/dto/update-status.dto';
import { BulkUpdateStatusDto } from '../blogs/dto/bulk-update-status.dto';

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

    const changes: string[] = [];
    const fieldsToCheck = ['title', 'content', 'summary', 'category', 'image', 'tags'];

    fieldsToCheck.forEach(field => {
      if (field === 'tags') {
        const oldTags = JSON.stringify(newsletter.tags || []);
        const newTags = JSON.stringify(updateNewsletterDto.tags || []);
        if (oldTags !== newTags) {
          changes.push(field);
        }
      } else if (updateNewsletterDto[field as keyof typeof updateNewsletterDto] !== undefined && 
                 updateNewsletterDto[field as keyof typeof updateNewsletterDto] !== newsletter[field as keyof typeof newsletter]) {
        changes.push(field);
      }
    });

    const userName = `${user.firstName} ${user.lastName}`;
    const editEntry = {
      userId: user.id,
      userName,
      editedAt: new Date().toISOString(),
      changes
    };

    const existingHistory = (newsletter.editHistory as any[]) || [];
    const updatedHistory = [...existingHistory, editEntry];

    const updateData: any = {
      ...updateNewsletterDto,
      image: updateNewsletterDto.image === '' ? null : updateNewsletterDto.image,
      lastEditedBy: userName,
      lastEditedAt: new Date(),
      editHistory: updatedHistory
    };

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

    const updateData: any = {
      status: updateStatusDto.status,
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

