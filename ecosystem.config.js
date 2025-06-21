module.exports = {
  apps: [
    {
      name: 'pos-system',
      script: 'server/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      exec_mode: 'fork',
      min_uptime: '10s',
      max_restarts: 10,
      monitoring: false,
      env_file: '.env',
      kill_timeout: 5000,
      restart_delay: 4000,
      ignore_watch: [
        'node_modules',
        'logs',
        'uploads',
        '.git'
      ],
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      health_check_grace_period: 3000,
      node_args: '--max-old-space-size=1024'
    }
  ],
  deploy: {
    production: {
      user: 'root',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/pos-system.git',
      path: '/var/www/pos-system',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production'
    }
  }
}; 