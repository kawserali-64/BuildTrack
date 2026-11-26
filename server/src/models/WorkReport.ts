import { model, models, Schema } from 'mongoose';

const workReportSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    contractorId: { type: String, required: true, index: true },
    type: { type: String, enum: ['daily', 'completion', 'delay'], required: true, index: true },
    workDate: { type: Date, required: true },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    progressPercent: { type: Number, required: true, min: 0, max: 100 },
    reviewStatus: {
      type: String,
      enum: ['not_required', 'pending', 'approved', 'rejected'],
      default: 'not_required',
      index: true,
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 1000, default: '' },
    photoUrls: {
      type: [{ type: String, trim: true, maxlength: 2048 }],
      default: [],
      validate: [(urls: string[]) => urls.length <= 10, 'A report can include at most 10 photo URLs.'],
    },
  },
  { timestamps: true },
);

workReportSchema.index({ contractorId: 1, workDate: -1 });
workReportSchema.index({ taskId: 1, type: 1, createdAt: -1 });

export const WorkReportModel = models.WorkReport || model('WorkReport', workReportSchema);
