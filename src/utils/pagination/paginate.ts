import { Model, Document, MongooseFilterQuery } from 'mongoose';
import { IPaginationOptions, IPaginationLinks } from './interfaces';
import { Pagination } from './pagination';

function resolveOptions(options: IPaginationOptions): [number, number, string] {
  const { page } = options;
  const { limit } = options;
  const { route } = options;

  return [page, limit, route];
}

function createPaginationObject<T>(
  items: T[],
  total_items: number,
  current_page: number,
  limit: number,
  route?: string,
): Pagination<T> {
  const total_pages = Math.ceil(total_items / limit);

  const has_first_page = route;
  const has_previous_page = route && current_page > 1;
  const has_next_page = route && current_page < total_pages;
  const has_last_page = route;

  const symbol = route && new RegExp(/\?/).test(route) ? '&' : '?';

  const routes: IPaginationLinks = {
    first: has_first_page ? `${route}${symbol}limit=${limit}` : '',
    previous: has_previous_page
      ? `${route}${symbol}page=${current_page - 1}&limit=${limit}`
      : '',
    next: has_next_page
      ? `${route}${symbol}page=${current_page + 1}&limit=${limit}`
      : '',
    last: has_last_page
      ? `${route}${symbol}page=${total_pages}&limit=${limit}`
      : '',
  };

  return new Pagination(
    items,
    {
      total_items,
      item_count: items.length,
      items_per_page: limit,
      total_pages,
      current_page,
    },
    routes,
  );
}

async function paginateModel<T extends Document>(
  repository: Model<T>,
  options: IPaginationOptions,
  search_options: MongooseFilterQuery<T>,
): Promise<Pagination<T>> {
  const [page, limit, route] = resolveOptions(options);

  if (page < 1) {
    return createPaginationObject([], 0, page, limit, route);
  }

  const total = await repository.countDocuments(search_options);

  const items = await repository
    .find(search_options)
    .skip(limit * (page - 1))
    .limit(limit);

  return createPaginationObject<T>(items, total, page, limit, route);
}

export async function paginate<T extends Document>(
  repository: Model<T>,
  options: IPaginationOptions,
  search_options: MongooseFilterQuery<T>,
): Promise<Pagination<T>> {
  return paginateModel<T>(repository, options, search_options);
}