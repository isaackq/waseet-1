import { Reflector } from '@nestjs/core';

/**
 * in this way we can declare the name of the key of the meta value
 */
// export const ROLES = 'Roles';
// export const Roles = (roles: RolesEnum[]) => SetMetadata(ROLES, roles);

/**
 * in this way the name of the key is the same as the name of the decorator == Roles
 */
export const Roles = Reflector.createDecorator<string[]>();
