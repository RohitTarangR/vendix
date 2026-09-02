import express from 'express';
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole, 
  getStaff, 
  createStaff, 
  updateStaff, 
  deleteStaff 
} from '../controllers/rbacController.js';
import { protect, checkPermission } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(checkPermission('manage_users'));

// Roles
router.get('/roles', getRoles);
router.post('/roles', createRole);
router.put('/roles/:id', updateRole);
router.delete('/roles/:id', deleteRole);

// Staff Users
router.get('/staff', getStaff);
router.post('/staff', createStaff);
router.put('/staff/:id', updateStaff);
router.delete('/staff/:id', deleteStaff);

export default router;
