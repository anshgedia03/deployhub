"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeployService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const adm_zip_1 = __importDefault(require("adm-zip"));
const shared_1 = require("@deployhub/shared");
const deploy_queue_1 = require("../queue/deploy.queue");
const notify_1 = require("../utils/notify");
class DeployService {
    static async processUpload(deploymentId, filePath) {
        const extractPath = path_1.default.resolve(process.cwd(), `deployments/${deploymentId}`);
        try {
            // Update state to EXTRACTING
            await shared_1.Deployment.updateOne({ deploymentId }, { status: 'EXTRACTING' });
            (0, notify_1.notifyStatus)(deploymentId, 'EXTRACTING');
            // Create deployments directory if it doesn't exist
            if (!fs_1.default.existsSync(extractPath)) {
                fs_1.default.mkdirSync(extractPath, { recursive: true });
            }
            // Extract the ZIP file synchronously to prevent race conditions
            const zip = new adm_zip_1.default(filePath);
            zip.extractAllTo(extractPath, true);
            // Update state to VALIDATING
            await shared_1.Deployment.updateOne({ deploymentId }, { status: 'VALIDATING' });
            (0, notify_1.notifyStatus)(deploymentId, 'VALIDATING');
            // Validate Dockerfile exists (removed for Railpack)
            const dockerfilePath = path_1.default.join(extractPath, 'Dockerfile');
            if (!fs_1.default.existsSync(dockerfilePath)) {
                shared_1.Logger.info('DeployService', 'No Dockerfile found. Proceeding with Railpack zero-config build.');
            }
            // Queue the job
            await deploy_queue_1.deployQueue.add('build-and-deploy', {
                deploymentId,
                extractPath,
            });
            shared_1.Logger.info('DeployService', `Deployment ${deploymentId} queued successfully`);
        }
        catch (error) {
            shared_1.Logger.error('DeployService', `Failed to process upload for ${deploymentId}`, error);
            await shared_1.Deployment.updateOne({ deploymentId }, { status: 'FAILED' });
            (0, notify_1.notifyStatus)(deploymentId, 'FAILED');
            // Write validation/extraction error to build.log so it displays on the frontend terminal
            try {
                if (!fs_1.default.existsSync(extractPath)) {
                    fs_1.default.mkdirSync(extractPath, { recursive: true });
                }
                const logFilePath = path_1.default.join(extractPath, 'build.log');
                const errMsg = `\r\n\x1b[31m[ERROR] Deployment failed during validation:\r\n${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`;
                fs_1.default.appendFileSync(logFilePath, errMsg);
            }
            catch (logErr) {
                shared_1.Logger.error('DeployService', 'Failed to write validation error to build.log', logErr);
            }
            throw error;
        }
        finally {
            // Clean up the uploaded ZIP file to prevent storage leaks
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
                shared_1.Logger.info('DeployService', `Cleaned up temporary upload file: ${filePath}`);
            }
        }
    }
}
exports.DeployService = DeployService;
//# sourceMappingURL=deploy.service.js.map