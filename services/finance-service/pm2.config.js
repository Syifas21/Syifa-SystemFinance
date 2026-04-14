module.exports = {
  apps: [{
    name: 'finance-service',
    script: 'ts-node',
    args: 'src/utils/server.ts',
    cwd: __dirname,
    instances: 1,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    env: {
      NODE_ENV: 'development',
      PORT: 3002
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true
  }]
};
