module.exports = {
  apps: [
    {
      name: 'racc-api',
      script: 'npm',
      args: 'start',
      cwd: '/Users/schott/Projects/racc-membership-app/ghl-api',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      watch: ['src'],
      ignore_watch: ['node_modules', 'logs', '*.log'],
      instances: 1,
      autorestart: true,
      max_memory_restart: '1G',
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Development specific settings
      watch_delay: 1000,
      restart_delay: 2000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};