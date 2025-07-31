// Define the possible sources for the resource ID
export type IdSourceType = 'param' | 'query' | 'body';

// Define the expected structure for ownable resources
export type OwnableResource = { userId: number; [key: string]: any };

// Define the interface for services used by the guard
export interface OwnableService {
  findById(id: number): Promise<OwnableResource>;
}

// Define keys for individual metadata
export const OWNER_SERVICE_KEY = 'ownerService';
export const ID_SOURCE_KEY = 'isUseQuery';
export const IS_ADMIN_BYPASS_ENABLED_KEY = 'isAdminBypassEnabled';
