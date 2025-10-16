/**
 * Pagination middleware for Mongoose queries
 * Adds pagination parameters and helpers to the request object
 */
const pagination = (defaultLimit = 20, maxLimit = 100) => {
  return (req, res, next) => {
    // Extract pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || defaultLimit, maxLimit);
    const skip = (page - 1) * limit;

    // Sort parameters
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortBy]: sortOrder };

    // Add pagination info to request
    req.pagination = {
      page,
      limit,
      skip,
      sort
    };

    // Helper function to create paginated response
    req.paginatedResults = async (model, query = {}, populate = null) => {
      try {
        // Count total documents
        const total = await model.countDocuments(query);

        // Calculate pagination metadata
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        // Build the query
        let dbQuery = model
          .find(query)
          .sort(sort)
          .limit(limit)
          .skip(skip);

        // Add population if specified
        if (populate) {
          if (Array.isArray(populate)) {
            populate.forEach(pop => {
              dbQuery = dbQuery.populate(pop);
            });
          } else {
            dbQuery = dbQuery.populate(populate);
          }
        }

        // Execute query
        const results = await dbQuery.exec();

        // Return paginated response
        return {
          data: results,
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext,
            hasPrev,
            nextPage: hasNext ? page + 1 : null,
            prevPage: hasPrev ? page - 1 : null
          }
        };
      } catch (error) {
        throw error;
      }
    };

    next();
  };
};

/**
 * Simple pagination helper for arrays
 * @param {Array} array - Array to paginate
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} Paginated result
 */
const paginateArray = (array, page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  const total = array.length;
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    data: array.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext,
      hasPrev,
      nextPage: hasNext ? page + 1 : null,
      prevPage: hasPrev ? page - 1 : null
    }
  };
};

/**
 * Build pagination links for API responses
 * @param {string} baseUrl - Base URL for links
 * @param {Object} pagination - Pagination metadata
 * @returns {Object} Links object
 */
const buildPaginationLinks = (baseUrl, pagination) => {
  const { page, limit, hasNext, hasPrev } = pagination;

  const links = {
    self: `${baseUrl}?page=${page}&limit=${limit}`,
    first: `${baseUrl}?page=1&limit=${limit}`,
    last: `${baseUrl}?page=${pagination.totalPages}&limit=${limit}`
  };

  if (hasNext) {
    links.next = `${baseUrl}?page=${page + 1}&limit=${limit}`;
  }

  if (hasPrev) {
    links.prev = `${baseUrl}?page=${page - 1}&limit=${limit}`;
  }

  return links;
};

module.exports = {
  pagination,
  paginateArray,
  buildPaginationLinks
};
