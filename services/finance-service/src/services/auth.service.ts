// ============================================
// PROJECT FINANCE - Auth Service
// ============================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma';

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  full_name: string;
  role: 'CEO' | 'FINANCE_ADMIN';
}

// Generate JWT Token
export const generateToken = (userId: string, email: string, role: string): string => {
  const secret = process.env.JWT_SECRET || 'ProjectFinance2026SecureKey!@#$%';
  return jwt.sign(
    { id: userId, email, role },
    secret,
    { expiresIn: '24h' }
  );
};

// Login User
export const loginUser = async (input: LoginInput) => {
  try {
    const { email, password } = input;

    // Find user by email
    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: false,
        message: 'Email atau password salah',
      };
    }

    // Check if user is active
    if (!user.is_active) {
      return {
        success: false,
        message: 'Akun Anda tidak aktif. Hubungi administrator.',
      };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    
    if (!isPasswordValid) {
      return {
        success: false,
        message: 'Email atau password salah',
      };
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Return user data without password
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active,
    };

    return {
      success: true,
      message: 'Login berhasil',
      user: userData,
      token,
    };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat login',
    };
  }
};

// Register User (Admin only)
export const registerUser = async (input: RegisterInput) => {
  try {
    const { email, password, full_name, role } = input;

    // Check if email already exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: 'Email sudah terdaftar',
      };
    }

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUser = await prisma.users.create({
      data: {
        email,
        password_hash,
        full_name,
        role,
        is_active: true,
      },
    });

    // Return user data without password
    const userData = {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
      is_active: newUser.is_active,
    };

    return {
      success: true,
      message: 'User berhasil didaftarkan',
      user: userData,
    };
  } catch (error) {
    console.error('Register error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat registrasi',
    };
  }
};

// Get User by ID
export const getUserById = async (userId: string) => {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    if (!user) {
      return {
        success: false,
        message: 'User tidak ditemukan',
      };
    }

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat mengambil data user',
    };
  }
};

// Verify Token
export const verifyToken = (token: string) => {
  try {
    const secret = process.env.JWT_SECRET || 'ProjectFinance2026SecureKey!@#$%';
    const decoded = jwt.verify(token, secret);
    return {
      success: true,
      data: decoded,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Token tidak valid',
    };
  }
};

// Get All Users
export const getAllUsers = async () => {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return {
      success: true,
      users,
    };
  } catch (error) {
    console.error('Get all users error:', error);
    return {
      success: false,
      message: 'Terjadi kesalahan saat mengambil data users',
    };
  }
};


