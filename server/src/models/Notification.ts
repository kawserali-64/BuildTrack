import { model, models, Schema } from 'mongoose';

const notificationSchema = new Schema(
  {
    recipientId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'project_assigned',
        'task_assigned',
        'deadline_reminder',
        'material_request_submitted',
        'material_request_reviewed',
        'progress_report_submitted',
        'task_progress_updated',
        'task_started',
        'task_status_updated',
        'completion_report_reviewed',
      ],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    relatedProjectId: { type: Schema.Types.ObjectId, ref: 'Project' },
    relatedTaskId: { type: Schema.Types.ObjectId, ref: 'Task' },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

export const NotificationModel = models.Notification || model('Notification', notificationSchema);
