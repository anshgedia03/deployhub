import mongoose, { Document, Schema } from 'mongoose';

export interface IDeployment extends Document {
  deploymentId: string;
  projectName: string;
  status: 'UPLOADING' | 'CLONING' | 'EXTRACTING' | 'VALIDATING' | 'BUILDING' | 'STARTING' | 'RUNNING' | 'FAILED' | 'STOPPED' | 'DELETED';
  containerId?: string;
  port?: number;
  publicUrl?: string;
  envVars?: string;
  gitUrl?: string;
  branch?: string;
  commitMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema: Schema = new Schema(
  {
    deploymentId: { type: String, required: true, unique: true },
    projectName: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ['UPLOADING', 'CLONING', 'EXTRACTING', 'VALIDATING', 'BUILDING', 'STARTING', 'RUNNING', 'FAILED', 'STOPPED', 'DELETED'], 
      default: 'UPLOADING' 
    },

    containerId: { type: String },
    port: { type: Number },
    publicUrl: { type: String },
    envVars: { type: String },
    gitUrl: { type: String },
    branch: { type: String },
    commitMessage: { type: String },
  },
  { timestamps: true }
);

export const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);
