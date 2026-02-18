import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { templatesService } from './templates.service';

export const templatesController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await templatesService.list()); } catch (err) { next(err); }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await templatesService.findById(req.params.id)); } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await templatesService.create(req.body, req.user!.id));
    } catch (err) { next(err); }
  },

  async submitToMeta(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await templatesService.submitToMeta(req.params.id)); } catch (err) { next(err); }
  },

  async syncFromMeta(req: AuthRequest, res: Response, next: NextFunction) {
    try { res.json(await templatesService.syncFromMeta()); } catch (err) { next(err); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await templatesService.delete(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
