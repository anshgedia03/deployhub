"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitDeployService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const shared_1 = require("@deployhub/shared");
const deploy_queue_1 = require("../queue/deploy.queue");
const notify_1 = require("../utils/notify");
class GitDeployService {
    static async processGitDeploy(deploymentId, gitUrl, branch = 'main') {
        const extractPath = path_1.default.resolve(process.cwd(), `deployments/${deploymentId}`);
        const tempPath = path_1.default.resolve(process.cwd(), `deployments/${deploymentId}_temp`);
        // Create directories if they don't exist
        if (!fs_1.default.existsSync(extractPath)) {
            fs_1.default.mkdirSync(extractPath, { recursive: true });
        }
        if (!fs_1.default.existsSync(tempPath)) {
            fs_1.default.mkdirSync(tempPath, { recursive: true });
        }
        const logFilePath = path_1.default.join(extractPath, 'build.log');
        const logStream = fs_1.default.createWriteStream(logFilePath, { flags: 'a' });
        const appendLog = (msg) => {
            logStream.write(msg);
            shared_1.redisPublisher.publish(`logs:${deploymentId}`, msg);
        };
        try {
            // 1. Update status to CLONING
            await shared_1.Deployment.updateOne({ deploymentId }, { status: 'CLONING' });
            (0, notify_1.notifyStatus)(deploymentId, 'CLONING');
            appendLog(`[INFO] Starting git clone from ${gitUrl} (branch: ${branch})...\r\n`);
            // 2. Clone the repository
            await new Promise((resolve, reject) => {
                // Spawn git clone command
                const gitProcess = (0, child_process_1.spawn)('git', ['clone', '--depth', '1', '-b', branch, gitUrl, '.'], {
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
                    }
                    else {
                        reject(new Error(`git clone failed with exit code ${code}`));
                    }
                });
                gitProcess.on('error', (err) => {
                    reject(err);
                });
            });
            appendLog(`\r\n[INFO] Git clone completed successfully. Moving files...\r\n`);
            // Clean up existing extractPath except build.log to prevent ENOTEMPTY on folder merge
            if (fs_1.default.existsSync(extractPath)) {
                const existingFiles = fs_1.default.readdirSync(extractPath);
                for (const file of existingFiles) {
                    if (file !== 'build.log') {
                        fs_1.default.rmSync(path_1.default.join(extractPath, file), { recursive: true, force: true });
                    }
                }
            }
            // Move files from tempPath to extractPath
            const files = fs_1.default.readdirSync(tempPath);
            for (const file of files) {
                fs_1.default.renameSync(path_1.default.join(tempPath, file), path_1.default.join(extractPath, file));
            }
            fs_1.default.rmdirSync(tempPath);
            // 3. Update state to VALIDATING
            await shared_1.Deployment.updateOne({ deploymentId }, { status: 'VALIDATING' });
            (0, notify_1.notifyStatus)(deploymentId, 'VALIDATING');
            appendLog(`[INFO] Validating repository structure...\r\n`);
            // 4. Validate Dockerfile exists (removed for Railpack)
            const dockerfilePath = path_1.default.join(extractPath, 'Dockerfile');
            if (!fs_1.default.existsSync(dockerfilePath)) {
                appendLog(`[INFO] No Dockerfile found in repository. Proceeding with Railpack zero-config build...\r\n`);
            }
            else {
                appendLog(`[INFO] Dockerfile found. Queueing build...\r\n`);
            }
            // 5. Queue the job
            await deploy_queue_1.deployQueue.add('build-and-deploy', {
                deploymentId,
                extractPath,
            });
            shared_1.Logger.info('GitDeployService', `Deployment ${deploymentId} queued successfully`);
        }
        catch (error) {
            shared_1.Logger.error('GitDeployService', `Failed to process git deploy for ${deploymentId}`, error);
            await shared_1.Deployment.updateOne({ deploymentId }, { status: 'FAILED' });
            (0, notify_1.notifyStatus)(deploymentId, 'FAILED');
            const errMsg = `\r\n\x1b[31m[ERROR] Git deployment failed: ${error instanceof Error ? error.message : String(error)}\x1b[0m\r\n`;
            appendLog(errMsg);
            // Clean up temp directory if it exists
            if (fs_1.default.existsSync(tempPath)) {
                try {
                    fs_1.default.rmSync(tempPath, { recursive: true, force: true });
                }
                catch (cleanupErr) {
                    shared_1.Logger.error('GitDeployService', 'Failed to clean up temp files after failure', cleanupErr);
                }
            }
            // Clean up directory if clone failed
            if (fs_1.default.existsSync(extractPath)) {
                try {
                    // Keep the log file so client can fetch it
                    const files = fs_1.default.readdirSync(extractPath);
                    for (const file of files) {
                        if (file !== 'build.log') {
                            fs_1.default.rmSync(path_1.default.join(extractPath, file), { recursive: true, force: true });
                        }
                    }
                }
                catch (cleanupErr) {
                    shared_1.Logger.error('GitDeployService', 'Failed to clean up cloned files after failure', cleanupErr);
                }
            }
            throw error;
        }
        finally {
            logStream.end();
        }
    }
}
exports.GitDeployService = GitDeployService;
//# sourceMappingURL=git.service.js.map