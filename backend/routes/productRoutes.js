import express from 'express';
import { getProducts, getProductById, createProduct, updateProduct, archiveProduct } from '../controllers/productController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('view_products', 'manage_pos'), getProducts);
router.get('/:id', checkPermission('view_products', 'manage_pos'), getProductById);
router.post('/', checkPermission('manage_products'), createProduct);
router.put('/:id', checkPermission('manage_products'), updateProduct);
router.delete('/:id', checkPermission('manage_products'), archiveProduct); // archive instead of delete

export default router;
