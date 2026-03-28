import { menuHierarchy } from '../../../frontend/src/utils/menuHierarchy';
import type { AdminMenuRoute } from './types';

export const adminMenuRoutes: AdminMenuRoute[] = menuHierarchy
  .filter((section) => !section.roles || section.roles.includes('ADMIN'))
  .flatMap((section) => section.items
    .filter((item) => !item.roles || item.roles.includes('ADMIN'))
    .map((item) => ({
      sectionId: section.id,
      sectionLabel: section.label,
      itemId: item.id,
      itemLabel: item.label,
      description: item.description,
      path: item.path,
    })));
