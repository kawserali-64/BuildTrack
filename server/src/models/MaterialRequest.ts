import { model, models, Schema } from 'mongoose';

const requestedMaterialSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    quantity: { type: Number, required: true, min: 0.001 },
    unit: { type: String, required: true, trim: true, maxlength: 30 },
    note: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false },
);

const materialRequestSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true, index: true },
    contractorId: { type: String, required: true, index: true },
    items: { type: [requestedMaterialSchema], required: true, validate: [(items: unknown[]) => items.length > 0, 'At least one material is required.'] },
    reason: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    reviewedBy: { type: String },
    reviewedAt: { type: Date },
    reviewNote: { type: String, trim: true, maxlength: 1000, default: '' },
  },
  { timestamps: true },
);

materialRequestSchema.index({ contractorId: 1, createdAt: -1 });
materialRequestSchema.index({ projectId: 1, status: 1 });

export const MaterialRequestModel =
  models.MaterialRequest || model('MaterialRequest', materialRequestSchema);
