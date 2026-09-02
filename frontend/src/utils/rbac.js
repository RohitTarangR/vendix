/**
 * Checks if a user has a specific permission.
 * Supports OWNER super-user role and wildcard '*' permissions.
 */
export const hasPermission = (user, permission) => {
  if (!user || !user.role) return false;
  
  // OWNER has full access
  const roleName = user.role.name || user.role;
  if (roleName === 'OWNER') return true;

  // Wildcard permissions
  const permissions = user.role.permissions || [];
  if (permissions.includes('*')) return true;

  return permissions.includes(permission);
};

// Available system permissions with human-friendly descriptions
export const SYSTEM_PERMISSIONS = {
  view_dashboard: { label: 'View Dashboard', description: 'Access to statistics, summary logs, and sales overview charts.' },
  manage_settings: { label: 'Manage Settings', description: 'Configure business profile, seed demo data, and customize settings.' },
  manage_pos: { label: 'Access POS (Point of Sale)', description: 'Operate the POS cash register, add items to cart, and checkout.' },
  view_orders: { label: 'View Order History', description: 'Search and read sales receipts and transactions logs.' },
  manage_orders: { label: 'Manage Orders (Refunds)', description: 'Issue refunds and modify active orders.' },
  view_products: { label: 'View Catalog (Products/Categories)', description: 'Browse products list and product categories.' },
  manage_products: { label: 'Manage Catalog (CRUD)', description: 'Create, modify, and archive products and categories.' },
  view_inventory: { label: 'View Inventory History', description: 'Audit inventory movement logs and stock status.' },
  manage_inventory: { label: 'Adjust Inventory', description: 'Manually adjust stock counts and audit logs.' },
  view_purchases: { label: 'View Purchases', description: 'View inbound stock purchase logs and invoices.' },
  manage_purchases: { label: 'Record Purchases', description: 'Add new purchase orders and replenish stock.' },
  view_customers: { label: 'View Customers', description: 'View customer directory and contact information.' },
  manage_customers: { label: 'Manage Customers', description: 'Create, edit, and deactivate customers.' },
  view_suppliers: { label: 'View Suppliers', description: 'View supplier vendors list and details.' },
  manage_suppliers: { label: 'Manage Suppliers', description: 'Create, edit, and deactivate vendor profiles.' },
  view_stores: { label: 'View Stores', description: 'View list of stores and branches.' },
  manage_stores: { label: 'Manage Stores', description: 'Create, edit, and close retail stores/branches.' },
  manage_users: { label: 'Manage Users & Roles (RBAC)', description: 'Manage staff accounts, assign roles, and customize permissions.' },
};
