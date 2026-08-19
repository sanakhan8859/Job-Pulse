const Job = require('../models/Job');

const MAX_LIMIT = 50;

function buildFilter(query) {
  const filter = {};

  if (query.search && query.search.trim()) {
    filter.$text = { $search: query.search.trim() };
  }

  if (query.remote === 'true') filter.remote = true;
  if (query.remote === 'false') filter.remote = false;

  if (query.location && query.location.trim()) {
    filter.location = { $regex: query.location.trim(), $options: 'i' };
  }

  if (query.tags) {
    const tags = Array.isArray(query.tags) ? query.tags : query.tags.split(',');
    filter.tags = { $in: tags.map((t) => t.trim()).filter(Boolean) };
  }

  if (query.includeStale !== 'true') {
    filter.isStale = false;
  }

  return filter;
}

async function listJobs(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const filter = buildFilter(req.query);

    const sortMap = {
      newest: { postedAt: -1, fetchedAt: -1 },
      oldest: { postedAt: 1, fetchedAt: 1 },
    };
    const sort = sortMap[req.query.sort] || sortMap.newest;

    const [items, total] = await Promise.all([
      Job.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      Job.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getJobById(req, res, next) {
  try {
    const job = await Job.findById(req.params.id).lean();
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
}

async function getStats(req, res, next) {
  try {
    const [total, remoteCount, bySource, topTags] = await Promise.all([
      Job.countDocuments({ isStale: false }),
      Job.countDocuments({ isStale: false, remote: true }),
      Job.aggregate([
        { $match: { isStale: false } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      Job.aggregate([
        { $match: { isStale: false } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
    ]);

    res.json({
      total,
      remoteCount,
      bySource: bySource.map((s) => ({ source: s._id, count: s.count })),
      topTags: topTags.map((t) => ({ tag: t._id, count: t.count })),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { listJobs, getJobById, getStats };
