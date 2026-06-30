import mongoose, { Document, Schema } from 'mongoose';

export interface IDeployment extends Document {
  deploymentId: string;
  projectName: string;
  status: 'UPLOADING' | 'EXTRACTING' | 'VALIDATING' | 'BUILDING' | 'STARTING' | 'RUNNING' | 'FAILED' | 'STOPPED' | 'DELETED';
  containerId?: string;
  port?: number;
  publicUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema: Schema = new Schema(
  {
    deploymentId: { type: String, required: true, unique: true },
    projectName: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ['UPLOADING', 'EXTRACTING', 'VALIDATING', 'BUILDING', 'STARTING', 'RUNNING', 'FAILED', 'STOPPED', 'DELETED'], 
      default: 'UPLOADING' 
    },
    containerId: { type: String },
    port: { type: Number },
    publicUrl: { type: String },
  },
  { timestamps: true }
);

export const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);
