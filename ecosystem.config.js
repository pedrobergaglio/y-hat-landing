module.exports = {
  apps: [{
    name: 'y-hat-landing',
    script: 'npm',
    args: 'start',
    cwd: '/home/CODE/y-hat-landing',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3018
    }
  }]
};