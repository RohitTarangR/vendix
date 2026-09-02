import express from 'express';
import { getStores, createStore, updateStore, deleteStore } from '../controllers/storeController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_stores'), getStores);
router.post('/', checkPermission('manage_stores'), createStore);
router.put('/:id', checkPermission('manage_stores'), updateStore);
router.delete('/:id', checkPermission('manage_stores'), deleteStore);

export default router;
