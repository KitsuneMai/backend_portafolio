import {
  Controller,
  Post,
  Body,
  Res,
  UnauthorizedException,
  UseGuards,
  Get,
  Req,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const token = await this.authService.login(user);
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: false, //  obligatorio con SameSite: 'none'
      sameSite: 'lax', //  permite cookies entre dominios distintos (Firebase y Cloud Run)
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    });
    return { message: 'Login exitoso', user };
  }


  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: Request) {
    return req.user; // viene del validate() del strategy
  }


  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    return { message: 'Sesión cerrada correctamente' };
  }

  // POST /auth/forgot-password
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.sendResetPasswordEmail(body.email);
  }

  // POST /auth/reset-password
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

}


