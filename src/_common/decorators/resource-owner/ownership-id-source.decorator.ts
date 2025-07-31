import { SetMetadata } from '@nestjs/common';
import {
  IdSourceType,
  ID_SOURCE_KEY,
} from 'src/_common/types/resource-owner.type';

/**
 * Decorator to specify where to get the resource ID from.
 * @param source Specifies where to get the resource ID from: 'param' (from URL params), 'user' (from authenticated user's ID), or 'query' (from a query parameter).
 * @param queryParamName Optional: The name of the query parameter to use if source is 'query'.
 */
export const OwnershipIdSource = (
  source: IdSourceType,
  queryParamName?: string,
) => {
  const metadata: { source: IdSourceType; queryParamName?: string } = {
    source,
  };
  if (queryParamName) metadata.queryParamName = queryParamName;

  return SetMetadata(ID_SOURCE_KEY, metadata);
};
