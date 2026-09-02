import express from 'express';
import { getInventoryTransactions, adjustStock } from '../controllers/inventoryController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/transactions', getInventoryTransactions);
router.post('/adjust', checkPermission('manage_inventory'), adjustStock);

export default router;
