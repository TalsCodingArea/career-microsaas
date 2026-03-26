/**
 * JobMarketData model — stores real or mock job market snapshots per career path.
 * Populated by scraper jobs (or seed script for v1). Indexed on careerPath for
 * fast evaluation queries.
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { IJobMarketData } from '../types/index.js';

export interface JobMarketDataDocument extends IJobMarketData, Document {}

const JobMarketDataSchema = new Schema<JobMarketDataDocument>(
  {
    careerPath: { type: String, required: true, index: true },
    role: { type: String, required: true },
    location: { type: String, required: true, default: 'global' },
    openPositionsCount: { type: Number, required: true, min: 0 },
    avgSalaryMin: { type: Number, required: true, min: 0 },
    avgSalaryMax: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: 'USD' },
    dataSource: { type: String, required: true },
    fetchedAt: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: false,
  }
);

// Compound index: one entry per careerPath + location combination
JobMarketDataSchema.index({ careerPath: 1, location: 1 });

export const JobMarketData = mongoose.model<JobMarketDataDocument>(
  'JobMarketData',
  JobMarketDataSchema
);
