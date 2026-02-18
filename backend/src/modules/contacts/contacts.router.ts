import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/auth.middleware';
import { contactsController } from './contacts.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

router.use(authenticate);

// Contatos
router.get('/', contactsController.list);
router.get('/:id', contactsController.getOne);
router.post('/', contactsController.create);
router.put('/:id', contactsController.update);
router.delete('/:id', contactsController.delete);
router.post('/import/csv', upload.single('file'), contactsController.importCSV);

// Listas
router.get('/lists/all', contactsController.getLists);
router.post('/lists', contactsController.createList);
router.post('/lists/:listId/contacts', contactsController.addToList);
router.delete('/lists/:listId/contacts/:contactId', contactsController.removeFromList);

export default router;
