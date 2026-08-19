const mongoose = require('mongoose');

const ingestionLogSchema = new mongoose.Schema(
  {
    source: { type: String, required: true, index: true },
    trigger: { type: String, enum: ['scheduled', 'manual'], default: 'scheduled' },
    status: {
      type: String,
      enum: ['success', 'partial', 'failed', 'skipped_circuit_open'],
      required: true,
    },

    pagesFetched: { type: Number, default: 0 },
    itemsFetched: { type: Number, default: 0 },
    itemsUpserted: { type: Number, default: 0 },
    itemsSkippedInvalid: { type: Number, default: 0 },
    staleMarked: { type: Number, default: 0 },

    durationMs: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
    warnings: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('IngestionLog', ingestionLogSchema);
