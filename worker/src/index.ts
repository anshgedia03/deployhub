import { Worker, Job } from 'bullmq';
import fs from 'fs';
import path from 'path';
import { env, Logger, configureNginx, redisPublisher, Deployment, mongoose } from '@deployhub/shared';
import { buildDockerImage, runContainer, pruneDanglingImages } from './docker.service';
import { getAvailablePort } from './utils/port';

// Connect to MongoDB
mongoose.connect(env.MONGODB_URI)
  .then(() => Logger.info('Worker', 'Connected to MongoDB'))
  .catch((err) => Logger.error('Worker', 'MongoDB connection error:', err));

const processJob = async (job: Job) => {
  const { deploymentId, extractPath } = job.data;
  
  Logger.info('Worker', `Starting Docker build at: ${extractPath}`);
  
  // 1. Find Deployment record
  let deployment = await Deployment.findOne({ deploymentId });
  if (!deployment) {
    deployment = await Deployment.create({ deploymentId, status: 'BUILDING' });
  } else {
    deployment.status = 'BUILDING';
    await deployment.save();
  }
  
  const notifyStatus = (status: string) => {
    redisPublisher.publish('status:broadcast', JSON.stringify({ deploymentId, status }));
  };
  
  notifyStatus('BUILDING');

  const logFilePath = path.join(extractPath, 'build.log');
  const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

  const appendLog = (msg: string) => {
    logStream.write(msg);
    redisPublisher.publish(`logs:${deploymentId}`, msg);
  };

  const projectName = deployment.projectName || deploymentId;

  try {
    // 2. Build Docker Image
    await buildDockerImage(extractPath, projectName, (logChunk) => {
      if (logChunk) {
        appendLog(logChunk + '\r\n'); // xterm formatting
      }
    });
    
    // 3. Find available port
    const hostPort = await getAvailablePort();
    
    // 4. Update status to STARTING
    deployment.status = 'STARTING';
    await deployment.save();
    notifyStatus('STARTING');
    
    // 5. Run the Container
    const containerId = await runContainer(projectName, hostPort);

    // 6. Generate Nginx configuration and reload
    const publicUrl = await configureNginx(projectName, hostPort);

    // 7. Update Database State to RUNNING
    deployment.status = 'RUNNING';
    deployment.containerId = containerId;
    deployment.port = hostPort;
    deployment.publicUrl = publicUrl;
    await deployment.save();
    notifyStatus('RUNNING');

    // Add success message
    const successMsg = `\r\n\x1b[32m[SUCCESS] Docker container started successfully.\x1b[0m\r\n\x1b[36m[INFO] Port: ${hostPort} | Container ID: ${containerId}\x1b[0m\r\n\x1b[35m[INFO] Public URL: ${publicUrl}\x1b[0m\r\n`;
    appendLog(successMsg);
    
    Logger.info('Worker', `Successfully deployed ${deploymentId} on port ${hostPort}`);
  } catch (error) {
    Logger.error('Worker', `Build/Run failed for deploymentId: ${deploymentId}`, error);
    const errMsg = `\r\n\x1b[31m[ERROR] Deployment failed: ${error}\x1b[0m\r\n`;
    appendLog(errMsg);

    deployment.status = 'FAILED';
    await deployment.save();
    notifyStatus('FAILED');

    throw error;
  } finally {
    logStream.end();
    
    // Asynchronously prune dangling images so we don't block
    pruneDanglingImages().catch((err) => Logger.error('Worker', 'Error pruning images', err));
  }
};

const worker = new Worker('deployments', processJob, {
  connection: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

worker.on('completed', (job) => {
  Logger.info('Worker', `Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  Logger.warn('Worker', `Job ${job?.id} has failed with ${err.message}`);
});

Logger.info('Worker', 'BullMQ worker initialized and listening to "deployments" queue...');
