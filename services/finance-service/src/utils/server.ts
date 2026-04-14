// src/utils/server.ts
import dotenv from "dotenv";
import path from "path";

// Load variabel environment dari .env dengan override untuk menghindari konflik
dotenv.config({ path: require('path').join(__dirname, '../../.env'), override: false });

// Force PORT dari .env local jika ada, atau gunakan default
const envPort = process.env.PORT;
const PORT = envPort && !isNaN(parseInt(envPort)) ? parseInt(envPort) : 3002;

// Catch unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack:', reason);
  // Don't exit - keep server running
});

// Catch uncaught exceptions  
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // Don't exit immediately - keep server running
});

// Keep process alive
setInterval(() => {
  // Ping to keep alive
}, 60000);


// Import app dari utils/app
import app from './app';
import { initFinanceCronJobs } from '../cron/finance-cron';
// import { initializeMarginAlertCron } from '../cron/margin-alerts.cron';

// Jalankan server dengan retry logic untuk EADDRINUSE
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function startServer() {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Finance Service running on http://localhost:${PORT}`);
    console.log('✅ Finance Service ready\n');
    retryCount = 0; // Reset retry count on success
    
    // Initialize cron jobs after server starts - TEMPORARILY DISABLED
    // console.log('\n🕐 Initializing Finance Automation...');
    // try {
    //   initFinanceCronJobs();
    //   console.log('✅ Auto-Invoice from Milestones: ENABLED (Daily at 1:00 AM)');
    // } catch (error) {
    //   console.error('❌ Cron initialization error:', error);
    // }
    // initializeMarginAlertCron();
  });

  // Handle server errors
  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`\n⚠️  Port ${PORT} already in use (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`⏳ Retrying in ${RETRY_DELAY / 1000} seconds...\n`);
        setTimeout(() => {
          startServer();
        }, RETRY_DELAY);
      } else {
        console.error(`\n❌ Failed to start server after ${MAX_RETRIES} retries`);
        console.error('💡 Solution: Kill the process using port:');
        console.error(`   netstat -ano | findstr :${PORT}`);
        console.error(`   taskkill /PID <PID> /F`);
        process.exit(1);
      }
    } else {
      console.error('❌ Server Error:', error);
      process.exit(1);
    }
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('\n📍 SIGTERM received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('\n📍 SIGINT received, shutting down gracefully...');
    server.close(() => {
      console.log('✅ Server closed');
      process.exit(0);
    });
  });

  return server;
}

// Start the server
const server = startServer();

// Keep server alive - don't exit on idle
process.stdin.resume();
