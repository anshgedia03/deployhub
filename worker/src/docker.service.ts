import Docker from 'dockerode';
import * as tar from 'tar-fs';

const docker = new Docker(); // Connects to /var/run/docker.sock by default

/**
 * Builds a Docker image from a given path.
 * 
 * @param extractPath - The directory containing the Dockerfile and source code.
 * @param deploymentId - Used to tag the resulting Docker image.
 * @param onLog - Callback function to stream logs chunk by chunk.
 */
export const buildDockerImage = async (
  extractPath: string,
  deploymentId: string,
  onLog: (logChunk: string) => void
): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      // Pack the directory into a tar stream
      const tarStream = tar.pack(extractPath);

      // Build the image
      docker.buildImage(
        tarStream,
        { t: deploymentId },
        (err, response) => {
          if (err) {
            return reject(err);
          }

          if (!response) {
            return reject(new Error('No response from docker build'));
          }

          // Follow the progress and stream logs
          docker.modem.followProgress(
            response,
            (onFinishedErr, res) => {
              if (onFinishedErr) {
                return reject(onFinishedErr);
              }
              // Check if any event in the output stream had an error
              const hasError = res?.find((r: any) => r.error);
              if (hasError) {
                return reject(new Error(hasError.error));
              }
              resolve();
            },
            (event: any) => {
              if (event.stream) {
                // E.g., 'Step 1/5 : FROM node:18'
                onLog(event.stream.trim());
              } else if (event.error) {
                onLog(`[ERROR] ${event.error}`);
              } else if (event.status) {
                // Pulling progress etc.
                onLog(event.status);
              }
            }
          );
        }
      );
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Runs a Docker container from an image.
 * Assumes the application inside listens on the injected PORT environment variable.
 * 
 * @param deploymentId - The image tag to run
 * @param hostPort - The port on the host machine to bind to
 * @returns The container ID
 */
export const runContainer = async (deploymentId: string, hostPort: number): Promise<string> => {
  let containerPort = 8080; // default fallback

  // Dynamically inspect the image to find the port exposed by the Dockerfile
  try {
    const imageInfo = await docker.getImage(deploymentId).inspect();
    if (imageInfo.Config.ExposedPorts) {
      const firstKey = Object.keys(imageInfo.Config.ExposedPorts)[0];
      if (firstKey) {
        containerPort = parseInt(firstKey.split('/')[0]!, 10);
      }
    }
  } catch (err) {
    console.warn(`Failed to inspect image ${deploymentId}, falling back to port 8080`);
  }

  const container = await docker.createContainer({
    Image: deploymentId,
    name: `deployx-${deploymentId}`,
    Env: [`PORT=${containerPort}`],
    ExposedPorts: {
      [`${containerPort}/tcp`]: {}
    },
    HostConfig: {
      PortBindings: {
        [`${containerPort}/tcp`]: [
          {
            HostPort: hostPort.toString()
          }
        ]
      }
    }
  });

  await container.start();
  
  return container.id;
};

/**
 * Prunes dangling (<none>:<none>) images to free up disk space.
 * This should be called after builds to clean up temporary cache layers.
 */
export const pruneDanglingImages = async (): Promise<void> => {
  try {
    await docker.pruneImages({
      filters: { dangling: { true: true } }
    });
  } catch (error) {
    console.error('Failed to prune dangling images:', error);
  }
};
