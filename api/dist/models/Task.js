import { Schema, model } from 'mongoose';
export const TASK_PRIORITIES = ['low', 'medium', 'high'];
export const TASK_STATUSES = ['todo', 'in-progress', 'review', 'done'];
const checklistItemSchema = new Schema({
    label: {
        type: String,
        required: true,
        trim: true,
    },
    done: {
        type: Boolean,
        default: false,
    },
}, { _id: false });
const taskSchema = new Schema({
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
}, {
    timestamps: true,
});
const Task = model('Task', taskSchema);
export default Task;
