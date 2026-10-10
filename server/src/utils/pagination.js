export function getPagination(query, defaultLimit = 20) {
  const requested = query.page !== undefined || query.limit !== undefined;
  const page = requested ? Number(query.page || 1) : 1;
  const limit = requested ? Number(query.limit || defaultLimit) : null;

  return {
    requested,
    page,
    limit,
    skip: limit === null ? 0 : (page - 1) * limit,
  };
}

export function getPaginationMetadata(total, pagination) {
  const pages = pagination.limit === null
    ? (total > 0 ? 1 : 0)
    : Math.ceil(total / pagination.limit);
  const page = pages === 0 ? 1 : Math.min(pagination.page, pages);

  return {
    page,
    limit: pagination.limit,
    total,
    pages,
  };
}
