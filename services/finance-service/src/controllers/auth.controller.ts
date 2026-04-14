// ============================================
// PROJECT FINANCE - Auth Controller
// ============================================

import { Request, Response } from 'express';
import { loginUser, registerUser, getUserById, getAllUsers } from '../services/auth.service';

// Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email dan password harus diisi',
      });
    }

    const result = await loginUser({ email, password });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(401).json(result);
    }
  } catch (error) {
    console.error('Login controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
};

// Register (Admin only)
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, full_name, role } = req.body;

    if (!email || !password || !full_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi',
      });
    }

    // Validate role
    if (!['CEO', 'FINANCE_ADMIN'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid',
      });
    }

    const result = await registerUser({ email, password, full_name, role });

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error('Register controller error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
};

// Get Current User
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const result = await getUserById(userId);

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(404).json(result);
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
};

// Get All Users (CEO only)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user?.role;

    // Only CEO can view all users
    if (userRole !== 'CEO') {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Hanya CEO yang bisa melihat semua users.',
      });
    }

    const result = await getAllUsers();

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan server',
    });
  }
};
