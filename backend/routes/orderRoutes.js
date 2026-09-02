import express from 'express';
import { createOrder, getOrders, getOrderById, refundOrder, updateHeldOrder, completeHeldOrder } from '../controllers/orderController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', checkPermission('manage_pos'), createOrder);
router.get('/', checkPermission('view_orders'), getOrders);
router.get('/:id', checkPermission('view_orders'), getOrderById);
router.put('/:id/hold', checkPermission('manage_pos'), updateHeldOrder);
router.post('/:id/complete', checkPermission('manage_pos'), completeHeldOrder);
router.post('/:id/refund', checkPermission('manage_orders'), refundOrder);

export default router;
