import { Schema, Types, model, type HydratedDocument } from 'mongoose'

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const
export const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done'] as const

interface ChecklistItem {
  label: string
  done: boolean
}

export interface ITask {
  resource: Types.ObjectId
  assignee: Types.ObjectId
  title: string
  details: string
  estimateHours: number
  priority: (typeof TASK_PRIORITIES)[number]
  status: (typeof TASK_STATUSES)[number]
  dueDate?: Date
  checklist: ChecklistItem[]
  attachments: string[]
  createdAt: Date
  updatedAt: Date
}

export type TaskDocument = HydratedDocument<ITask>

const checklistItemSchema = new Schema<ChecklistItem>(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false },
)

const taskSchema = new Schema<ITask>(
  {
    resource: {
      type: Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
    estimateHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    priority: {
      type: String,
      enum: TASK_PRIORITIES,
      default: 'medium',
      required: true,
    },
    status: {
      type: String,
      enum: TASK_STATUSES,
      default: 'todo',
      required: true,
    },
    dueDate: {
      type: Date,
    },
    checklist: {
      type: [checklistItemSchema],
      default: [],
    },
    attachments: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
)

const Task = model<ITask>('Task', taskSchema)

export default Task