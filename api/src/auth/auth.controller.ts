import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';

@Public()
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google/url')
  getLoginUrl() {
    return { url: this.authService.getLoginUrl() };
  }
}
