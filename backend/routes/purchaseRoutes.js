import express from 'express';
import { createPurchase, getPurchases, getPurchaseById } from '../controllers/purchaseController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', checkPermission('manage_purchases'), createPurchase);
router.get('/', checkPermission('view_purchases'), getPurchases);
router.get('/:id', checkPermission('view_purchases'), getPurchaseById);

export default router;
