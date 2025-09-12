import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ResendService } from '../mailer/resend.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private resendService: ResendService,
  ) { }

  async validateUser(email: string, password: string) {
    return this.usersService.validateUser(email, password);
  }

  async login(user: any) {
    const payload = { username: user.email, sub: user.id };
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET!,
      expiresIn: '1d',
    });
  }
  async sendResetPasswordEmail(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const payload = { sub: user.id };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' }); // Token válido por 15 minutos

    await this.resendService.enviarCorreoRecuperacion(user.email, token);
    return { message: 'Correo de recuperación enviado' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.usersService.findById(decoded.sub);
      if (!user) throw new NotFoundException('Usuario no encontrado');

      const hashed = await bcrypt.hash(newPassword, 10);
      await this.usersService.updatePassword(user.id, hashed);

      return { message: 'Contraseña actualizada correctamente' };
    } catch (err) {
      throw new BadRequestException('Token inválido o expirado');
    }
  }
}
