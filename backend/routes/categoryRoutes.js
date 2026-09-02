import express from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categoryController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_products'), getCategories);
router.post('/', checkPermission('manage_products'), createCategory);
router.put('/:id', checkPermission('manage_products'), updateCategory);
router.delete('/:id', checkPermission('manage_products'), deleteCategory);

export default router;
