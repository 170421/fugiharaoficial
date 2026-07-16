import { Router } from 'express';
import { webhooksController } from './webhooks.controller';

const router = Router();

// Rota de verificação (GET) e recebimento (POST) do webhook Meta
router.get('/whatsapp', webhooksController.verify);
router.post('/whatsapp', webhooksController.handle);

export default router;
