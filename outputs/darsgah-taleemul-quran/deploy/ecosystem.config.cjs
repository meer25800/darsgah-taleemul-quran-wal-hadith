module.exports = {
  apps: [
    {
      name: "darsgah-api",
      cwd: "/var/www/darsgahkongamdara/backend",
      script: "src/server.js",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      env_production: {
        NODE_ENV: "production",
        PORT: "5000"
      }
    },
    {
      name: "darsgah-web",
      cwd: "/var/www/darsgahkongamdara/frontend-next",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      interpreter: "node",
      instances: 1,
      autorestart: true,
      max_memory_restart: "700M",
      env_production: {
        NODE_ENV: "production",
        PORT: "3000"
      }
    }
  ]
};
