import { Controller, Get, Delete, Param, Query, Redirect, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleService } from './google.service';
import { AuthService } from '../auth/auth.service';
import { GetUser } from '../auth/get-user.decorator';
import { Public } from '../auth/public.decorator';
import { AuthUser } from '../auth/jwt.types';

@Controller('google')
export class GoogleController {
  private readonly logger = new Logger(GoogleController.name);

  constructor(
    private readonly googleService: GoogleService,
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Get('oauth/url')
  getOAuthUrl(@GetUser() user: AuthUser) {
    return { url: this.googleService.getAuthorizationUrl(user.id) };
  }

  @Public()
  @Get('oauth/callback')
  @Redirect()
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
  ) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    if (error || !code) {
      const dest = state === 'login' ? 'login' : 'accounts';
      return { url: `${frontendUrl}/${dest}?error=${error || 'no_code'}` };
    }

    try {
      if (state === 'login') {
        const token = await this.authService.handleLoginCallback(code);
        return { url: `${frontendUrl}/auth/callback?token=${token}` };
      } else {
        const { email } = await this.googleService.exchangeCodeAndSave(code, state);
        this.logger.log(`Connected Google account: ${email}`);
        return { url: `${frontendUrl}/accounts?connected=true` };
      }
    } catch (err) {
      this.logger.error(`OAuth callback failed (state=${state}): ${err.message}`);
      const dest = state === 'login' ? 'login' : 'accounts';
      return { url: `${frontendUrl}/${dest}?error=oauth_failed` };
    }
  }

  @Get('accounts')
  listAccounts(@GetUser() user: AuthUser) {
    return this.googleService.listAccounts(user.id);
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string, @GetUser() user: AuthUser) {
    return this.googleService.deleteAccount(id, user.id);
  }

  @Get('accounts/:id/calendars')
  listCalendars(@Param('id') id: string) {
    return this.googleService.listCalendars(id);
  }
}
