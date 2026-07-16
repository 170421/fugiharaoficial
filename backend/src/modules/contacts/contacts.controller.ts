import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { contactsService } from './contacts.service';

export const contactsController = {
  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const search = req.query.search as string | undefined;
      const tag = req.query.tag as string | undefined;
      res.json(await contactsService.list({ page, limit, search, tag }));
    } catch (err) { next(err); }
  },

  async getOne(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await contactsService.findById(req.params.id));
    } catch (err) { next(err); }
  },

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await contactsService.create(req.body));
    } catch (err) { next(err); }
  },

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await contactsService.update(req.params.id, req.body));
    } catch (err) { next(err); }
  },

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await contactsService.delete(req.params.id);
      res.status(204).send();
    } catch (err) { next(err); }
  },

  async importCSV(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.file) return res.status(400).json({ error: 'Arquivo CSV não enviado' });
      const listId = req.body.listId as string | undefined;
      res.json(await contactsService.importCSV(req.file.buffer, listId));
    } catch (err) { next(err); }
  },

  async getLists(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.json(await contactsService.getLists());
    } catch (err) { next(err); }
  },

  async createList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      res.status(201).json(await contactsService.createList(req.body));
    } catch (err) { next(err); }
  },

  async addToList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { contactIds } = req.body;
      res.json(await contactsService.addToList(req.params.listId, contactIds));
    } catch (err) { next(err); }
  },

  async removeFromList(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await contactsService.removeFromList(req.params.listId, req.params.contactId);
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
