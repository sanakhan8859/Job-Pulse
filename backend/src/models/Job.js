const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    // externalId + source together uniquely identify a listing at the origin site
    externalId: { type: String, required: true },
    source: { type: String, required: true, index: true }, // e.g. "arbeitnow"

    title: { type: String, required: true, trim: true, index: true },
    company: { type: String, trim: true, index: true },
    location: { type: String, trim: true, default: 'Not specified' },
    remote: { type: Boolean, default: false, index: true },

    description: { type: String, default: '' },
    tags: { type: [String], default: [], index: true },
    jobTypes: { type: [String], default: [] }, // full_time, contract, etc.

    url: { type: String, required: true, unique: true }, // canonical listing URL (dedupe key)

    salary: { type: String, default: null },
    postedAt: { type: Date, default: null }, // when the source says it was posted
    fetchedAt: { type: Date, default: Date.now }, // when WE pulled it
    isStale: { type: Boolean, default: false }, // true once it stops appearing in the source feed
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

jobSchema.index({ title: 'text', company: 'text', description: 'text', tags: 'text' });
jobSchema.index({ source: 1, externalId: 1 }, { unique: true });

module.exports = mongoose.model('Job', jobSchema);
