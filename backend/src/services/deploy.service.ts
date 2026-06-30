import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { Deployment, Logger } from '@deployhub/shared';
import { deployQueue } from '../queue/deploy.queue';
import { notifyStatus } from '../utils/notify';
import { ValidationError } from '@deployhub/shared';

export class DeployService {
  static async processUpload(deploymentId: string, filePath: string) {
    const extractPath = path.resolve(process.cwd(), `deployments/${deploymentId}`);

    try {
      // Update state to EXTRACTING
      await Deployment.updateOne({ deploymentId }, { status: 'EXTRACTING' });
      notifyStatus(deploymentId, 'EXTRACTING');

      // Create deployments directory if it doesn't exist
      if (!fs.existsSync(extractPath)) {
        fs.mkdirSync(extractPath, { recursive: true });
      }

      // Extract the ZIP file synchronously to prevent race conditions
      const zip = new AdmZip(filePath);
      zip.extractAllTo(extractPath, true);

      // Update state to VALIDATING
      await Deployment.updateOne({ deploymentId }, { status: 'VALIDATING' });
      notifyStatus(deploymentId, 'VALIDATING');

      // Validate Dockerfile exists
      const dockerfilePath = path.join(extractPath, 'Dockerfile');
      if (!fs.existsSync(dockerfilePath)) {
        throw new ValidationError('Invalid project: No Dockerfile found in the root of the ZIP archive.');
      }

      // Queue the job
      await deployQueue.add('build-and-deploy', {
        deploymentId,
        extractPath,
      });

      Logger.info('DeployService', `Deployment ${deploymentId} queued successfully`);
    } catch (error) {
      Logger.error('DeployService', `Failed to process upload for ${deploymentId}`, error);
      await Deployment.updateOne({ deploymentId }, { status: 'FAILED' });
      notifyStatus(deploymentId, 'FAILED');
      
      // Write validation/extraction error to build.log so it displays on the frontend terminal
      try {
        if (!fs.existsSync(extractPath)) {
          fs.mkdirSync(extractPath, { recursive: true });
        }
        const logFilePath = path.join(extractPath, 'build.log');
        const errMsg = `\r\n\x1b[31m[ERROR] Deployment failed during validation:\r\n${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`;
        fs.appendFileSync(logFilePath, errMsg);
      } catch (logErr) {
        Logger.error('DeployService', 'Failed to write validation error to build.log', logErr);
      }

      throw error;
    } finally {
      // Clean up the uploaded ZIP file to prevent storage leaks
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        Logger.info('DeployService', `Cleaned up temporary upload file: ${filePath}`);
      }
    }
  }
}
