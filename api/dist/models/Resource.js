import { Schema, model } from 'mongoose';
export const RESOURCE_STATUSES = ['planning', 'active', 'blocked', 'completed'];
const sprintWindowSchema = new Schema({
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
}, { _id: false });
const progressEntrySchema = new Schema({
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
}, { _id: false });
const resourceSchema = new Schema({
    project: {
        type: Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
    },
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
}, {
    timestamps: true,
});
const Resource = model('Resource', resourceSchema);
export default Resource;
