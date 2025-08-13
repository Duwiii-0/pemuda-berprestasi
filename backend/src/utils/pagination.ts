interface PaginationResult {
  data: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function paginate(
  model: any,
  options: any,
  page: number = 1,
  limit: number = 10
): Promise<PaginationResult> {
  const skip = (page - 1) * limit;
  
  const [data, totalItems] = await Promise.all([
    model.findMany({
      ...options,
      skip,
      take: limit
    }),
    model.count({ where: options.where })
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
}