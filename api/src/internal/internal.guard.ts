import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class InternalSyncGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader: string = request.headers['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const expectedToken = process.env.INTERNAL_SYNC_TOKEN;

    if (!expectedToken) {
      throw new UnauthorizedException('INTERNAL_SYNC_TOKEN is not configured');
    }
    if (!token || token !== expectedToken) {
      throw new UnauthorizedException('Invalid or missing sync token');
    }
    return true;
  }
}
