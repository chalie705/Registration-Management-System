exports.getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
};

exports.paginated = (data, total, { page, limit }) => ({
  data,
  meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
});