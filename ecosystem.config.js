module.exports = {
  apps: [
    {
      name: 'deployhub-backend',
      script: 'npm',
      args: 'run dev --workspace=backend',
      env: {
        NODE_ENV: 'development',
        HOST: '0.0.0.0'
      }
    },
    {
      name: 'deployhub-worker',
      script: 'npm',
      args: 'run dev --workspace=worker',
      env: {
        NODE_ENV: 'development'
      }
    },
    {
      name: 'deployhub-frontend',
      script: 'npm',
      args: 'run start --workspace=frontend',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '0.0.0.0',
        PORT: 3000
      }
    }
  ]
};
