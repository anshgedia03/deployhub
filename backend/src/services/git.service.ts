import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { Deployment, Logger, ValidationError, redisPublisher } from '@deployhub/shared';
import { deployQueue } from '../queue/deploy.queue';
import { notifyStatus } from '../utils/notify';

export class GitDeployService {
  static async processGitDeploy(deploymentId: string, gitUrl: string, branch: string = 'main') {
    const extractPath = path.resolve(process.cwd(), `deployments/${deploymentId}`);
    const tempPath = path.resolve(process.cwd(), `deployments/${deploymentId}_temp`);
    
    // Create directories if they don't exist
    if (!fs.existsSync(extractPath)) {
      fs.mkdirSync(extractPath, { recursive: true });
    }
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, { recursive: true });
    }

    const logFilePath = path.join(extractPath, 'build.log');
    const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

    const appendLog = (msg: string) => {
      logStream.write(msg);
      redisPublisher.publish(`logs:${deploymentId}`, msg);
    };

    try {
      // 1. Update status to CLONING
      await Deployment.updateOne({ deploymentId }, { status: 'CLONING' });
      notifyStatus(deploymentId, 'CLONING');
      appendLog(`[INFO] Starting git clone from ${gitUrl} (branch: ${branch})...\r\n`);

      // 2. Clone the repository
      await new Promise<void>((resolve, reject) => {
        // Spawn git clone command
        const gitProcess = spawn('git', ['clone', '--depth', '1', '-b', branch, gitUrl, '.'], {
          cwd: tempPath,
          env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } // Prevent interactive prompts (e.g. password prompts)
        });

        gitProcess.stdout.on('data', (data) => {
          appendLog(data.toString());
        });

        gitProcess.stderr.on('data', (data) => {
          // git clone progress is written to stderr
          appendLog(data.toString());
        });

        gitProcess.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`git clone failed with exit code ${code}`));
          }
        });

        gitProcess.on('error', (err) => {
          reject(err);
        });
      });

      appendLog(`\r\n[INFO] Git clone completed successfully. Moving files...\r\n`);

      // Clean up existing extractPath except build.log to prevent ENOTEMPTY on folder merge
      if (fs.existsSync(extractPath)) {
        const existingFiles = fs.readdirSync(extractPath);
        for (const file of existingFiles) {
          if (file !== 'build.log') {
            fs.rmSync(path.join(extractPath, file), { recursive: true, force: true });
          }
        }
      }

      // Move files from tempPath to extractPath
      const files = fs.readdirSync(tempPath);
      for (const file of files) {
        fs.renameSync(path.join(tempPath, file), path.join(extractPath, file));
      }
      fs.rmdirSync(tempPath);

      // 3. Update state to VALIDATING
      await Deployment.updateOne({ deploymentId }, { status: 'VALIDATING' });
      notifyStatus(deploymentId, 'VALIDATING');
      appendLog(`[INFO] Validating repository structure...\r\n`);

      // 4. Validate Dockerfile exists
      const dockerfilePath = path.join(extractPath, 'Dockerfile');
      if (!fs.existsSync(dockerfilePath)) {
        throw new ValidationError('Invalid repository: No Dockerfile found in the root of the repository.');
      }

      appendLog(`[INFO] Dockerfile found. Queueing build...\r\n`);

      // 5. Queue the job
      await deployQueue.add('build-and-deploy', {
        deploymentId,
        extractPath,
      });

      Logger.info('GitDeployService', `Deployment ${deploymentId} queued successfully`);
    } catch (error) {
      Logger.error('GitDeployService', `Failed to process git deploy for ${deploymentId}`, error);
      await Deployment.updateOne({ deploymentId }, { status: 'FAILED' });
      notifyStatus(deploymentId, 'FAILED');
      
      const errMsg = `\r\n\x1b[31m[ERROR] Git deployment failed: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`;
      appendLog(errMsg);

      // Clean up temp directory if it exists
      if (fs.existsSync(tempPath)) {
        try {
          fs.rmSync(tempPath, { recursive: true, force: true });
        } catch (cleanupErr) {
          Logger.error('GitDeployService', 'Failed to clean up temp files after failure', cleanupErr);
        }
      }

      // Clean up directory if clone failed
      if (fs.existsSync(extractPath)) {
        try {
          // Keep the log file so client can fetch it
          const files = fs.readdirSync(extractPath);
          for (const file of files) {
            if (file !== 'build.log') {
              fs.rmSync(path.join(extractPath, file), { recursive: true, force: true });
            }
          }
        } catch (cleanupErr) {
          Logger.error('GitDeployService', 'Failed to clean up cloned files after failure', cleanupErr);
        }
      }

      throw error;
    } finally {
      logStream.end();
    }
  }

}
