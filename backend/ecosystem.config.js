module.exports = {
  apps: [
    {
      name: 'myzubster-backend',
      script: 'src/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      exp_backoff_restart_delay: 1000,
      out_file: './logs/pm2-out.log',
      error_file: './logs/pm2-error.log',
      env: {
        NODE_ENV: 'production',
        MONITOR_AUTO_RECOVERY: 'true',
        MONITOR_RECOVERY_MODE: 'pm2',
        PM2_APP_NAME: 'myzubster-backend'
      }
    }
  ]
};
