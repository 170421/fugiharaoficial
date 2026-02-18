import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { templatesController } from './templates.controller';

const router = Router();
router.use(authenticate);

router.get('/', templatesController.list);
router.get('/:id', templatesController.getOne);
router.post('/', templatesController.create);
router.post('/:id/submit', templatesController.submitToMeta);
router.post('/sync', templatesController.syncFromMeta);
router.delete('/:id', templatesController.delete);

export default router;
