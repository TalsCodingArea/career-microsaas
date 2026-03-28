/**
 * Lead model — captures contact details from users who opt in after
 * completing their career evaluation. Linked to a session by sessionId.
 */

import mongoose, { Schema, Document } from 'mongoose';

export interface ILead {
  email: string;
  name?: string;
  sessionId?: string;
  careerPath?: string;
  createdAt: Date;
}

export interface LeadDocument extends ILead, Document {}

const LeadSchema = new Schema<LeadDocument>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    name: { type: String, trim: true },
    sessionId: { type: String, index: true },
    careerPath: { type: String },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

export const Lead = mongoose.model<LeadDocument>('Lead', LeadSchema);
