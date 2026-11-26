import { model, models, Schema } from 'mongoose';

const progressEntrySchema = new Schema(
  {
    progressPercent: { type: Number, required: true, min: 0, max: 100 },
    note: { type: String, trim: true, maxlength: 2000, default: '' },
    updatedBy: { type: String, required: true },
    updatedAt: { type: Date, required: true, default: Date.now },
  },
  { _id: false },
);

const taskSchema = new Schema(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    assignedBy: { type: String, required: true },
    assignedContractorIds: { type: [String], default: [], index: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'under_review', 'completed', 'blocked'],
      default: 'todo',
      index: true,
    },
    dueDate: { type: Date },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
    progressHistory: { type: [progressEntrySchema], default: [] },
  },
  { timestamps: true },
);

taskSchema.index({ assignedContractorIds: 1, dueDate: 1 });

export const TaskModel = models.Task || model('Task', taskSchema);
