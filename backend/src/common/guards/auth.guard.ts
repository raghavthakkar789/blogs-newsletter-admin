import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }
    
    const token = authHeader.split(' ')[1]?.trim();
    const adminToken = this.configService.get<string>('ADMIN_TOKEN', 'admin-token')?.trim();

    // Debug logging (remove in production)
    if (process.env.NODE_ENV === 'development') {
      console.debug('[AuthGuard] Received token:', token ? `${token.substring(0, 10)}...` : 'none');
      console.debug('[AuthGuard] Expected token:', adminToken ? `${adminToken.substring(0, 10)}...` : 'none');
      console.debug('[AuthGuard] Tokens match:', token === adminToken);
    }

    if (!token || token !== adminToken) {
      throw new UnauthorizedException('Unauthorized: Token mismatch');
    }

    // Set hardcoded admin user from env
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL', 'admin@example.com');
    const adminName = this.configService.get<string>('ADMIN_NAME', 'Admin User');
    const nameParts = adminName.split(' ');

    request.user = {
      id: 'admin',
      email: adminEmail,
      firstName: nameParts[0] || 'Admin',
      lastName: nameParts.slice(1).join(' ') || 'User',
    };

    return true;
  }
}

