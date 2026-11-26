import { model, models, Schema } from 'mongoose';

const projectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 5000, default: '' },
    location: { type: String, trim: true, maxlength: 300, default: '' },
    startDate: { type: Date },
    expectedEndDate: { type: Date },
    budget: { type: Number, min: 0, default: 0 },
    managerId: { type: String, required: true, index: true },
    siteEngineerIds: { type: [String], default: [] },
    contractorIds: { type: [String], default: [] },
    status: {
      type: String,
      enum: ['planning', 'ongoing', 'on_hold', 'completed', 'cancelled'],
      default: 'planning',
      index: true,
    },
    progressPercent: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true },
);

projectSchema.index({ contractorIds: 1, status: 1 });
projectSchema.index({ managerId: 1, updatedAt: -1 });

export const ProjectModel = models.Project || model('Project', projectSchema);
