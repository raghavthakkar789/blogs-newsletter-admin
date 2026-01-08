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

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const { method, url, params, body } = request;
    const response = context.switchToHttp().getResponse();

    const action = this.getActionFromMethod(method, url);
    const entityType = this.getEntityTypeFromUrl(url);

    return next.handle().pipe(
      tap({
        next: async (data: unknown) => {
          // Only log user-initiated changes (POST, PATCH, DELETE)
          // Exclude GET requests and other read-only operations
          const shouldLog = this.shouldLogAction(method, action);
          
          if (shouldLog && response.statusCode >= 200 && response.statusCode < 400) {
            try {
              const adminId = await getAdminUserId();
              
              // Extract entity ID from response data with proper type guards
              let entityId: string | null = params?.id || null;
              if (!entityId && data && typeof data === 'object') {
                const dataObj = data as Record<string, unknown>;
                if ('id' in dataObj && typeof dataObj.id === 'string') {
                  entityId = dataObj.id;
                } else if ('blog' in dataObj && dataObj.blog && typeof dataObj.blog === 'object') {
                  const blog = dataObj.blog as Record<string, unknown>;
                  if ('id' in blog && typeof blog.id === 'string') {
                    entityId = blog.id;
                  }
                } else if ('newsletter' in dataObj && dataObj.newsletter && typeof dataObj.newsletter === 'object') {
                  const newsletter = dataObj.newsletter as Record<string, unknown>;
                  if ('id' in newsletter && typeof newsletter.id === 'string') {
                    entityId = newsletter.id;
                  }
                }
              }
              
              await createActivityLog({
                userId: adminId,
                action,
                entityType: entityType || null,
                entityId,
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

  /**
   * Determine if an action should be logged
   * Only log user-initiated changes (CREATE, UPDATE, DELETE operations)
   * Exclude GET requests and other read-only operations
   */
  private shouldLogAction(method: string, action: string): boolean {
    // Only log POST, PATCH, DELETE methods (not GET)
    if (method === 'GET') {
      return false;
    }

    // Only log meaningful user actions
    const loggableActions = [
      'CREATE_BLOG',
      'UPDATE_BLOG',
      'UPDATE_BLOG_STATUS',
      'DELETE_BLOG',
      'BULK_UPDATE_BLOG_STATUS',
      'CREATE_NEWSLETTER',
      'UPDATE_NEWSLETTER',
      'UPDATE_NEWSLETTER_STATUS',
      'DELETE_NEWSLETTER',
      'BULK_UPDATE_NEWSLETTER_STATUS',
    ];

    return loggableActions.includes(action);
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

