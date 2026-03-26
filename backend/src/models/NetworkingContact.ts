/**
 * NetworkingContact model — curated list of LinkedIn contacts returned to users
 * based on their target career path. Indexed on careerPathTags for fast filtered
 * queries.
 */

import mongoose, { Schema, Document } from 'mongoose';
import type { INetworkingContact } from '../types/index.js';

export interface NetworkingContactDocument extends INetworkingContact, Document {}

const NetworkingContactSchema = new Schema<NetworkingContactDocument>(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    company: { type: String, required: true },
    linkedinUrl: { type: String, required: true },
    careerPathTags: { type: [String], required: true, default: [], index: true },
    relevanceScore: { type: Number, required: true, min: 0, max: 1, default: 0.5 },
  },
  {
    timestamps: false,
  }
);

// Index for fast career path filtering and sorting by relevance
NetworkingContactSchema.index({ careerPathTags: 1, relevanceScore: -1 });

export const NetworkingContact = mongoose.model<NetworkingContactDocument>(
  'NetworkingContact',
  NetworkingContactSchema
);
