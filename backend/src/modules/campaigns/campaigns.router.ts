import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { campaignsController } from './campaigns.controller';

const router = Router();
router.use(authenticate);

router.get('/', campaignsController.list);
router.get('/:id', campaignsController.getOne);
router.post('/', campaignsController.create);
router.post('/:id/launch', campaignsController.launch);
router.post('/:id/pause', campaignsController.pause);
router.post('/:id/cancel', campaignsController.cancel);
router.get('/:id/messages', campaignsController.getMessages);

export default router;
