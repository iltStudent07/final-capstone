import { Schema, Types, model, type HydratedDocument } from 'mongoose'

export const PROJECT_PRIORITIES = ['low', 'medium', 'high', 'critical'] as const
export const PROJECT_STATUSES = ['todo', 'in-progress', 'review', 'done'] as const

export interface IProject {
  title: string
  description: string
  status: (typeof PROJECT_STATUSES)[number]
  priority: (typeof PROJECT_PRIORITIES)[number]
  tasks: Types.ObjectId[]
  assignee?: Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

export type ProjectDocument = HydratedDocument<IProject>

const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: PROJECT_STATUSES,
      default: 'todo',
      required: true,
    },
    priority: {
      type: String,
      enum: PROJECT_PRIORITIES,
      default: 'medium',
      required: true,
    },
    tasks: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Task' }],
      default: [],
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

const Project = model<IProject>('Project', projectSchema)

export default Project
