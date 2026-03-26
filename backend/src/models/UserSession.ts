/**
 * UserSession model — stores an anonymous user's questionnaire answers and
 * the evaluation result snapshot returned to them. Sessions are identified by
 * a client-generated UUID (no auth required in v1).
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { IUserSession } from '../types/index.js';

export interface UserSessionDocument extends IUserSession, Document {}

const AnswerSchema = new Schema(
  {
    questionId: { type: String, required: true },
    answer: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const EvaluationResultSchema = new Schema(
  {
    timelineWeeksMin: Number,
    timelineWeeksMax: Number,
    timelineLabel: String,
    marketSnapshot: Schema.Types.Mixed,
    tips: [String],
    networkingContacts: [Schema.Types.Mixed],
    score: Number,
  },
  { _id: false }
);

const UserSessionSchema = new Schema<UserSessionDocument>(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    answers: { type: [AnswerSchema], required: true, default: [] },
    careerPath: { type: String, required: true, index: true },
    experienceLevel: {
      type: String,
      enum: ['junior', 'mid', 'senior', 'executive'],
      required: true,
    },
    resultSnapshot: { type: EvaluationResultSchema, default: null },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

export const UserSession = mongoose.model<UserSessionDocument>('UserSession', UserSessionSchema);
