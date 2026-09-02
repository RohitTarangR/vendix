import express from 'express';
import { getSettings, updateSettings, getDashboardStats } from '../controllers/tenantController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/settings', getSettings);
router.put('/settings', checkPermission('manage_settings'), updateSettings);
router.get('/stats', checkPermission('view_dashboard'), getDashboardStats);


export default router;
