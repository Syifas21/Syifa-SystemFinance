// src/routes/health.route.ts
import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';

const router = Router();

interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  service: string;
  version: string;
  uptime: number;
  checks: {
    database: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
    memory: {
      status: 'ok' | 'warning' | 'critical';
      used: string;
      total: string;
      percentage: number;
    };
    disk?: {
      status: 'ok' | 'warning' | 'critical';
      available: string;
    };
  };
  environment: string;
}

/**
 * GET /api/health
 * Comprehensive health check endpoint
 */
router.get('/', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Database health check
    let dbStatus: 'up' | 'down' = 'down';
    let dbLatency: number | undefined;
    let dbError: string | undefined;

    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatency = Date.now() - dbStart;
      dbStatus = 'up';
    } catch (error: any) {
      dbError = error.message;
      dbStatus = 'down';
    }

    // Memory check
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memPercentage = (usedMem / totalMem) * 100;
    
    let memStatus: 'ok' | 'warning' | 'critical' = 'ok';
    if (memPercentage > 90) memStatus = 'critical';
    else if (memPercentage > 75) memStatus = 'warning';

    // Overall status
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (dbStatus === 'down') overallStatus = 'unhealthy';
    else if (memStatus === 'critical') overallStatus = 'degraded';

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'Project Finance API',
      version: '1.0.0',
      uptime: process.uptime(),
      checks: {
        database: {
          status: dbStatus,
          latency: dbLatency,
          error: dbError
        },
        memory: {
          status: memStatus,
          used: `${(usedMem / 1024 / 1024).toFixed(2)} MB`,
          total: `${(totalMem / 1024 / 1024).toFixed(2)} MB`,
          percentage: Math.round(memPercentage)
        }
      },
      environment: process.env.NODE_ENV || 'development'
    };

    const statusCode = overallStatus === 'healthy' ? 200 : 
                       overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json(response);
  } catch (error: any) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Project Finance API',
      version: '1.0.0',
      error: error.message
    });
  }
});

/**
 * GET /api/health/ready
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      ready: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      ready: false,
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/health/live
 * Liveness probe - checks if service is running
 */
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    alive: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/health/metrics
 * Detailed metrics for monitoring
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Database metrics
    let dbMetrics = {
      connected: false,
      activeConnections: 0
    };

    try {
      await prisma.$queryRaw`SELECT 1`;
      dbMetrics.connected = true;
      
      // Get active connections
      const result: any = await prisma.$queryRaw`
        SELECT count(*) as count 
        FROM pg_stat_activity 
        WHERE datname = current_database()
      `;
      dbMetrics.activeConnections = parseInt(result[0]?.count || '0');
    } catch (error) {
      // Database not available
    }

    res.status(200).json({
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      process: {
        pid: process.pid,
        nodeVersion: process.version,
        platform: process.platform
      },
      memory: {
        rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memUsage.external / 1024 / 1024).toFixed(2)} MB`
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      database: dbMetrics
    });
  } catch (error: any) {
    res.status(500).json({
      error: error.message
    });
  }
});

export default router;
