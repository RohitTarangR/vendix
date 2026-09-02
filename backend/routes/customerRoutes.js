import express from 'express';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_customers', 'manage_pos'), getCustomers);
router.post('/', checkPermission('manage_customers', 'manage_pos'), createCustomer);
router.put('/:id', checkPermission('manage_customers'), updateCustomer);
router.delete('/:id', checkPermission('manage_customers'), deleteCustomer);

export default router;
