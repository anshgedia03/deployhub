import mongoose, { Document, Schema } from 'mongoose';

export interface IDeployment extends Document {
  deploymentId: string;
  userId: string;
  projectName: string;
  status: 'UPLOADING' | 'CLONING' | 'EXTRACTING' | 'VALIDATING' | 'BUILDING' | 'STARTING' | 'RUNNING' | 'FAILED' | 'STOPPED' | 'DELETED';
  containerId?: string;
  port?: number;
  publicUrl?: string;
  envVars?: string;
  gitUrl?: string;
  branch?: string;
  organizationId?: string;
  accessControl?: { employeeId: mongoose.Types.ObjectId; accessLevel: 'full' | 'limited' }[];
  createdAt: Date;
  updatedAt: Date;
}

const DeploymentSchema: Schema = new Schema(
  {
    deploymentId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    projectName: { type: String, required: true, unique: true },
    status: { 
      type: String, 
      enum: ['UPLOADING', 'CLONING', 'EXTRACTING', 'VALIDATING', 'BUILDING', 'STARTING', 'RUNNING', 'FAILED', 'STOPPED', 'DELETED'], 
      default: 'UPLOADING' 
    },
    organizationId: { type: String },

    containerId: { type: String },
    port: { type: Number },
    publicUrl: { type: String },
    envVars: { type: String },
    gitUrl: { type: String },
    branch: { type: String },
    accessControl: [{
      employeeId: { type: Schema.Types.ObjectId, ref: 'User' },
      accessLevel: { type: String, enum: ['full', 'limited'] }
    }]
  },
  { timestamps: true }
);

export const Deployment = mongoose.model<IDeployment>('Deployment', DeploymentSchema);
