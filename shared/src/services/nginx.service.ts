import fs from 'fs/promises';
import path from 'path';
import Docker from 'dockerode';

const docker = new Docker();
const NGINX_CONTAINER_NAME = 'deployhub-nginx';
const CONF_DIR = path.resolve(__dirname, '../../../nginx/conf.d');

/**
 * Creates an Nginx location block configuration and reloads Nginx safely.
 * @param deploymentId The project ID
 * @param port The bound host port
 * @returns The public URL path
 */
export const configureNginx = async (deploymentId: string, port: number): Promise<string> => {
  const confPath = path.join(CONF_DIR, `${deploymentId}.conf`);
  const publicPath = `/${deploymentId}`;

  const configContent = `
location ${publicPath}/ {
    proxy_pass http://host.docker.internal:${port}/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    
    # Rewrite path so the app doesn't see the /deploymentId prefix
    rewrite ^${publicPath}/(.*) /$1 break;
}
`;

  // Write configuration
  await fs.mkdir(CONF_DIR, { recursive: true });
  await fs.writeFile(confPath, configContent);

  try {
    // Find Nginx container
    const containers = await docker.listContainers();
    const nginxContainerInfo = containers.find(c => c.Names.includes(`/${NGINX_CONTAINER_NAME}`));
    
    if (!nginxContainerInfo) {
      console.warn(`[Nginx] ${NGINX_CONTAINER_NAME} container not found. Config written but not reloaded.`);
      return publicPath;
    }

    const nginxContainer = docker.getContainer(nginxContainerInfo.Id);

    // Test configuration safely
    const testExec = await nginxContainer.exec({
      Cmd: ['nginx', '-t'],
      AttachStdout: true,
      AttachStderr: true,
    });
    
    const testStream = await testExec.start({});
    
    const testCode = await new Promise<number>((resolve) => {
      // Check exit code periodically or listen to stream end.
      // Dockerode stream end doesn't reliably give exit code directly from stream,
      // so we use inspect.
      const checkExit = setInterval(async () => {
        const inspect = await testExec.inspect();
        if (!inspect.Running) {
          clearInterval(checkExit);
          resolve(inspect.ExitCode || 0);
        }
      }, 100);
    });

    if (testCode !== 0) {
      // Invalid configuration, rollback
      await fs.unlink(confPath);
      throw new Error('Nginx configuration validation failed. Rolled back.');
    }

    // Reload Nginx
    const reloadExec = await nginxContainer.exec({
      Cmd: ['nginx', '-s', 'reload'],
      AttachStdout: true,
      AttachStderr: true,
    });
    await reloadExec.start({});
    
    return publicPath;
  } catch (error) {
    // Rollback if something goes wrong during exec
    try {
      await fs.unlink(confPath);
    } catch (e) {}
    throw error;
  }
};

/**
 * Removes Nginx configuration for a deployment and reloads.
 */
export const removeNginxConfig = async (deploymentId: string): Promise<void> => {
  const confPath = path.join(CONF_DIR, `${deploymentId}.conf`);
  try {
    await fs.unlink(confPath);
    
    // Find Nginx container and reload
    const containers = await docker.listContainers();
    const nginxContainerInfo = containers.find(c => c.Names.includes(`/${NGINX_CONTAINER_NAME}`));
    
    if (nginxContainerInfo) {
      const nginxContainer = docker.getContainer(nginxContainerInfo.Id);
      const reloadExec = await nginxContainer.exec({
        Cmd: ['nginx', '-s', 'reload'],
        AttachStdout: true,
        AttachStderr: true,
      });
      await reloadExec.start({});
    }
  } catch (error: any) {
    if (error.code !== 'ENOENT') {
      console.error(`[Nginx] Failed to remove config for ${deploymentId}`, error);
    }
  }
};
