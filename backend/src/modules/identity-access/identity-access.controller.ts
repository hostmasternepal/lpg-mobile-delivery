import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { IdentityAccessService } from './identity-access.service';

const REFRESH_COOKIE = 'refresh_token';

@Controller('auth')
export class IdentityAccessController {
  constructor(
    private readonly identityAccess: IdentityAccessService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.identityAccess.login(dto);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (!presented) {
      throw new UnauthorizedException('No refresh token presented.');
    }
    const { accessToken, refreshToken } = await this.identityAccess.refresh(presented);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const presented = req.cookies?.[REFRESH_COOKIE];
    if (presented) {
      await this.identityAccess.logout(presented);
    }
    res.clearCookie(REFRESH_COOKIE);
  }

  private setRefreshCookie(res: Response, refreshToken: string) {
    // httpOnly + Secure + SameSite=Strict, per docs/ARCHITECTURE.md §6.
    res.cookie(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.config.get<string>('nodeEnv') === 'production',
      sameSite: 'strict',
      path: '/api/v1/auth',
    });
  }
}
