import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as {
      id: string;
      email: string;
      role: string;
    };
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}
