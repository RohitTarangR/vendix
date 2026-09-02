import express from 'express';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../controllers/supplierController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_suppliers'), getSuppliers);
router.post('/', checkPermission('manage_suppliers'), createSupplier);
router.put('/:id', checkPermission('manage_suppliers'), updateSupplier);
router.delete('/:id', checkPermission('manage_suppliers'), deleteSupplier);

export default router;
