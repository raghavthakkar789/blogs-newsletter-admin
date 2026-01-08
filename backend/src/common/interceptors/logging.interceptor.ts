import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { getAdminUserId } from '../../utils/adminUser';
import { createActivityLog } from '../../db/queries';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, body } = request;
    const response = context.switchToHttp().getResponse();

    const action = this.getActionFromMethod(method, url);
    const entityType = this.getEntityTypeFromUrl(url);

    return next.handle().pipe(
      tap({
        next: async (data) => {
          // Log successful requests (2xx status codes)
          if (response.statusCode >= 200 && response.statusCode < 400) {
            try {
              const adminId = await getAdminUserId();
              await createActivityLog({
                userId: adminId,
                action,
                entityType: entityType || null,
                entityId: params?.id || data?.id || data?.blog?.id || data?.newsletter?.id || null,
                details: {
                  method,
                  path: url,
                  body,
                },
                ipAddress: request.ip,
                userAgent: request.get('user-agent') || null,
              });
            } catch (error) {
              // Don't fail the request if logging fails
              console.error('Failed to log activity:', error);
            }
          }
        },
        error: (error) => {
          // Errors are handled by exception filter
        },
      }),
    );
  }

  private getActionFromMethod(method: string, url: string): string {
    if (url.includes('/blogs')) {
      if (method === 'POST') return 'CREATE_BLOG';
      if (method === 'PATCH' && url.includes('/status')) return 'UPDATE_BLOG_STATUS';
      if (method === 'PATCH') return 'UPDATE_BLOG';
      if (method === 'DELETE') return 'DELETE_BLOG';
      if (method === 'PATCH' && url.includes('/bulk')) return 'BULK_UPDATE_BLOG_STATUS';
    }
    if (url.includes('/newsletters')) {
      if (method === 'POST') return 'CREATE_NEWSLETTER';
      if (method === 'PATCH' && url.includes('/status')) return 'UPDATE_NEWSLETTER_STATUS';
      if (method === 'PATCH') return 'UPDATE_NEWSLETTER';
      if (method === 'DELETE') return 'DELETE_NEWSLETTER';
      if (method === 'PATCH' && url.includes('/bulk')) return 'BULK_UPDATE_NEWSLETTER_STATUS';
    }
    return `${method}_${url.split('/').pop()?.toUpperCase() || 'UNKNOWN'}`;
  }

  private getEntityTypeFromUrl(url: string): string | null {
    if (url.includes('/blogs')) return 'Blog';
    if (url.includes('/newsletters')) return 'Newsletter';
    return null;
  }
}

