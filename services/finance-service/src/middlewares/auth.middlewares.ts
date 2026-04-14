import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // Try to get token from header
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // Development mode: use token OR create mock user with role from query
  if (process.env.NODE_ENV === 'development') {
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const decoded = jwt.verify(token, secret) as any;
        console.log(`🔓 Dev mode: Using token with role: ${decoded.role}`);
        (req as any).user = decoded;
        return next();
      } catch (err) {
        console.warn('Token invalid, using mock user');
      }
    }
    
    // Fallback: mock user with role from query or header
    const roleFromQuery = (req.query.role as string) || 'FINANCE_ADMIN';
    console.log(`🔓 Dev mode: Mock user with role: ${roleFromQuery}`);
    (req as any).user = { 
      id: 'dev-user', 
      email: 'dev@finance.local',
      role: roleFromQuery 
    };
    return next();
  }

  // Production: strict token requirement
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Token tidak ditemukan" });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET tidak ditemukan di environment");
      return res.status(500).json({ success: false, message: "Konfigurasi server salah" });
    }

    const decoded = jwt.verify(token!, secret);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: "Token tidak valid" });
  }
};
