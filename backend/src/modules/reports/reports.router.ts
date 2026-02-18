import { Router, Response, NextFunction } from 'express';
import { authenticate, AuthRequest } from '../../middlewares/auth.middleware';
import { reportsService } from './reports.service';

const router = Router();
router.use(authenticate);

router.get('/dashboard', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await reportsService.getDashboardStats()); } catch (err) { next(err); }
});

router.get('/campaigns/:id', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await reportsService.getCampaignReport(req.params.id)); } catch (err) { next(err); }
});

router.get('/opt-outs', async (req: AuthRequest, res: Response, next: NextFunction) => {
  try { res.json(await reportsService.getOptOutReport()); } catch (err) { next(err); }
});

export default router;
