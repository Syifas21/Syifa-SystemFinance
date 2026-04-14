// ============================================
// PROJECT FINANCE - Auth Routes
// ============================================

import { Router } from 'express';
import { login, register, getCurrentUser, getUsers } from '../controllers/auth.controller';
import { verifyToken } from '../middlewares/auth.middlewares';

const router = Router();

// Public routes
router.post('/login', login);

// Protected routes
router.post('/register', verifyToken, register);
router.get('/me', verifyToken, getCurrentUser);
router.get('/users', verifyToken, getUsers);

export default router;
