import { Inject, Injectable, Scope } from '@nestjs/common';
import { PaginationDto } from '../dtos/pagination-query.dto';
import { ObjectLiteral, Repository } from 'typeorm';
import type { Request } from 'express';
import { REQUEST } from '@nestjs/core';
import { paginated } from '../interfaces/paginated.interface';
import { FilterQuery, Model, SortOrder } from 'mongoose';

@Injectable()
export class PaginationProvider {
  constructor /**
   * Injecting request
   */() {} // private readonly request: Request, // @Inject(REQUEST)

  //T extends ObjectLiteral يعني انو الي جاية اوبجكت مش من نوع تي
  public async paginateQuery<T extends ObjectLiteral>( //T can be object depinding on the repo we pass here
    paginationQuery: PaginationDto,
    repository: Repository<T>,
    request: Request,
  ): Promise<paginated<T>> {
    let results: T[] = await repository.find({
      skip: (paginationQuery.page - 1) * paginationQuery.limit,
      take: paginationQuery.limit,
    });
    const totalItems = await repository.count();

    const finalResponse: paginated<T> = {
      data: results,
      meta: {
        itemsPerPage: paginationQuery.limit,
        totalItems: totalItems,
        cuurentPage: paginationQuery.page,
        totalPages: Math.ceil(totalItems / paginationQuery.limit),
      },
      links: this.buildPageLinks(paginationQuery, totalItems, request),
    };
    return finalResponse;
  }

  public async paginateMongooseQuery<T extends ObjectLiteral>(
    paginationQuery: PaginationDto,
    model: Model<T>,
    filter: FilterQuery<T> = {},
    sort: Record<string, SortOrder> = { createdAt: -1 },
    request: Request,
  ): Promise<paginated<T>> {
    const [results, totalItems] = await Promise.all([
      model
        .find(filter)
        .sort(sort)
        .skip((paginationQuery.page - 1) * paginationQuery.limit)
        .limit(paginationQuery.limit),
      model.countDocuments(filter),
    ]);
    console.log('results', results);
    console.log('totalItems', totalItems);

    const finalResponse: paginated<T> = {
      data: results,
      meta: {
        itemsPerPage: paginationQuery.limit,
        totalItems: totalItems,
        cuurentPage: paginationQuery.page,
        totalPages: Math.ceil(totalItems / paginationQuery.limit),
      },
      links: this.buildPageLinks(paginationQuery, totalItems, request),
    };
    return finalResponse;
  }

  private buildPageLinks(
    paginationQuery: PaginationDto,
    totalItems: number,
    request: Request,
  ) {
    /**
     * Create request URLS
     */
    const baseUrl = request.protocol + '://' + request.headers.host + '/';

    const newUrl = new URL(request.url, baseUrl);

    const totalPages = Math.ceil(totalItems / paginationQuery.limit) || 1;
    const nextPage =
      paginationQuery.page === totalPages
        ? paginationQuery.page
        : paginationQuery.page + 1;

    const previousPage =
      paginationQuery.page === 1
        ? paginationQuery.page
        : paginationQuery.page - 1;

    return {
      first: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQuery.limit}&page=1`,
      last: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQuery.limit}&page=${totalPages}`,
      cuurent: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQuery.limit}&page=${paginationQuery.page}`,
      next: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQuery.limit}&page=${nextPage}`,
      previous: `${newUrl.origin}${newUrl.pathname}?limit=${paginationQuery.limit}&page=${previousPage}`,
    };
  }
}
