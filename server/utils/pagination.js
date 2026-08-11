// Cursor pagination helpers.
//
// Offset pagination (skip/limit) degrades badly once a collection grows: Mongo has to walk
// and discard every skipped document, and rows shift under the reader when new items are
// inserted while they scroll. We use keyset ("cursor") pagination instead: the cursor encodes
// the sort key of the last item returned, and the next page is "everything strictly after it".
//
// Cursor format: base64url of `<ISO date>|<objectId>`. The ObjectId tie-breaks documents that
// share the exact same timestamp, so pages never overlap or skip an item.

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parseLimit = (value, fallback = DEFAULT_LIMIT) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_LIMIT);
};

const encodeCursor = (doc, field = 'createdAt') => {
  if (!doc) return null;
  const date = doc[field] instanceof Date ? doc[field] : new Date(doc[field]);
  return Buffer.from(`${date.toISOString()}|${doc._id.toString()}`).toString('base64url');
};

const decodeCursor = (cursor) => {
  if (!cursor) return null;
  try {
    const [iso, id] = Buffer.from(String(cursor), 'base64url').toString('utf8').split('|');
    const date = new Date(iso);
    if (Number.isNaN(date.getTime()) || !id) return null;
    return { date, id };
  } catch {
    return null;
  }
};

// Builds the "older than the cursor" filter fragment for a descending (newest first) sort.
const cursorFilter = (cursor, field = 'createdAt') => {
  const decoded = decodeCursor(cursor);
  if (!decoded) return {};
  return {
    $or: [
      { [field]: { $lt: decoded.date } },
      { [field]: decoded.date, _id: { $lt: decoded.id } },
    ],
  };
};

const sortSpec = (field = 'createdAt') => ({ [field]: -1, _id: -1 });

// Runs a page query: fetch limit + 1 so we know whether another page exists without a count().
const paginate = async (query, { limit, field = 'createdAt' }) => {
  const docs = await query.sort(sortSpec(field)).limit(limit + 1);
  const hasMore = docs.length > limit;
  const page = hasMore ? docs.slice(0, limit) : docs;
  return {
    docs: page,
    hasMore,
    nextCursor: hasMore ? encodeCursor(page[page.length - 1], field) : null,
  };
};

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  parseLimit,
  encodeCursor,
  decodeCursor,
  cursorFilter,
  sortSpec,
  paginate,
};
