module.exports = {
  apps: [
    {
      name: 'finance-api',
      script: 'npm',
      args: 'start',
      cwd: './services/finance-service',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    },
    {
      name: 'finance-frontend',
      script: 'npx',
      args: 'serve -s dist -l 5173',
      cwd: './frontend/apps/finance-frontend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      time: true
    }
  ],

  deploy: {
    production: {
      user: 'your-user',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-repo/finance.git',
      path: '/var/www/finance',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};
