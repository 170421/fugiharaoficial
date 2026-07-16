import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../database/client';
import { config } from '../../config';

export class AuthService {
  async register(data: { name: string; email: string; password: string }) {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw Object.assign(new Error('E-mail já cadastrado'), { statusCode: 409 });

    const password = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, password },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    return { user, token: this.signToken(user) };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.active) throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw Object.assign(new Error('Credenciais inválidas'), { statusCode: 401 });

    const { password: _, ...safe } = user;
    return { user: safe, token: this.signToken(safe) };
  }

  private signToken(user: { id: string; email: string; role: string }) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as object,
    );
  }
}

export const authService = new AuthService();
