import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { campaignsService } from './campaigns.service';

export const campaignsController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const status = req.query.status as string | undefined;
      res.json(await campaignsService.list({ page, limit, status }));
    } catch (err) { next(err); }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await campaignsService.findById(req.params.id));
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await campaignsService.create(req.body, req.user!.id));
    } catch (err) { next(err); }
  },

  async launch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await campaignsService.launch(req.params.id));
    } catch (err) { next(err); }
  },

  async pause(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await campaignsService.pause(req.params.id));
    } catch (err) { next(err); }
  },

  async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await campaignsService.cancel(req.params.id));
    } catch (err) { next(err); }
  },

  async getMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 50;
      const status = req.query.status as string | undefined;
      res.json(await campaignsService.getMessages(req.params.id, { page, limit, status }));
    } catch (err) { next(err); }
  },
};
