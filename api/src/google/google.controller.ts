import { Controller, Get, Delete, Param, Query, Redirect, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleService } from './google.service';

@Controller('google')
export class GoogleController {
  private readonly logger = new Logger(GoogleController.name);

  constructor(
    private readonly googleService: GoogleService,
    private readonly config: ConfigService,
  ) {}

  @Get('oauth/url')
  getOAuthUrl() {
    const url = this.googleService.getAuthorizationUrl();
    return { url };
  }

  @Get('oauth/callback')
  @Redirect()
  async handleCallback(@Query('code') code: string, @Query('error') error: string) {
    const frontendUrl = this.config.get('FRONTEND_URL') || 'http://localhost:5173';

    if (error || !code) {
      this.logger.error(`OAuth error: ${error}`);
      return { url: `${frontendUrl}/accounts?error=${error || 'no_code'}` };
    }

    try {
      const { email } = await this.googleService.exchangeCodeAndSave(code);
      this.logger.log(`Connected Google account: ${email}`);
      return { url: `${frontendUrl}/accounts?connected=true` };
    } catch (err) {
      this.logger.error(`Failed to exchange OAuth code: ${err.message}`);
      return { url: `${frontendUrl}/accounts?error=exchange_failed` };
    }
  }

  @Get('accounts')
  listAccounts() {
    return this.googleService.listAccounts();
  }

  @Delete('accounts/:id')
  deleteAccount(@Param('id') id: string) {
    return this.googleService.deleteAccount(id);
  }

  @Get('accounts/:id/calendars')
  listCalendars(@Param('id') id: string) {
    return this.googleService.listCalendars(id);
  }
}
