import { Router } from 'express';
import { createEmployee, getEmployees, updateEmployeeAccessLevel } from '../controllers/employee.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Apply auth middleware to all routes in this file
router.use(requireAuth);

router.post('/', createEmployee);
router.get('/', getEmployees);
router.put('/:id/access', updateEmployeeAccessLevel);

export default router;
