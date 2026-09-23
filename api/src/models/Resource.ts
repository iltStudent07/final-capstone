import { Schema, Types, model, type HydratedDocument } from 'mongoose'

export const RESOURCE_STATUSES = ['planning', 'active', 'blocked', 'completed'] as const

interface SprintWindow {
  startDate: Date
  endDate: Date
}

interface ProgressEntry {
  label: string
  percentComplete: number
  recordedAt: Date
}

export interface IResource {
  title: string
  description: string
  budget: number
  status: (typeof RESOURCE_STATUSES)[number]
  tags: string[]
  owner: Types.ObjectId
  collaborators: Types.ObjectId[]
  sprintWindow: SprintWindow
  progressHistory: ProgressEntry[]
  createdAt: Date
  updatedAt: Date
}

export type ResourceDocument = HydratedDocument<IResource>

const sprintWindowSchema = new Schema<SprintWindow>(
  {
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
  },
  { _id: false },
)

const progressEntrySchema = new Schema<ProgressEntry>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    percentComplete: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
)

const resourceSchema = new Schema<IResource>(
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
    budget: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: RESOURCE_STATUSES,
      default: 'planning',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: {
      type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
      default: [],
    },
    sprintWindow: {
      type: sprintWindowSchema,
      required: true,
    },
    progressHistory: {
      type: [progressEntrySchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

const Resource = model<IResource>('Resource', resourceSchema)

export default Resource
