import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import * as mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type ProjectDocument = HydratedDocument<Project>;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true, maxlength: 50, minlength: 3 })
  name!: string;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  userId!: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ChatSession' }],
    default: [],
  })
  chatSessionIds!: string[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
