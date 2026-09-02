import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { 
  Shield, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  Key, 
  Check, 
  Info, 
  UserCheck, 
  Building,
  Lock,
  Mail,
  Phone,
  User,
  ShieldCheck,
  CheckSquare,
  Square,
  Eye,
  EyeOff
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { SYSTEM_PERMISSIONS } from '../../utils/rbac';
import CustomSelect from '../../components/common/CustomSelect';

export default function StaffAndRoles() {
  const queryClient = useQueryClient();
  const { addToast, showConfirm } = useUiStore();
  const [activeTab, setActiveTab] = useState('staff'); // 'staff' or 'roles'
  
  // Modals visibility
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Editing states
  const [editingStaff, setEditingStaff] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  // Forms state
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    roleId: '',
    status: 'ACTIVE'
  });

  const [roleForm, setRoleForm] = useState({
    name: '',
    permissions: []
  });

  // Queries
  const { data: staffData = [], isLoading: isStaffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await api.get('/rbac/staff');
      return res.data.data;
    }
  });

  const { data: rolesData = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await api.get('/rbac/roles');
      return res.data.data;
    }
  });

  // Mutations - Staff
  const createStaffMutation = useMutation({
    mutationFn: (newStaff) => api.post('/rbac/staff', newStaff),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      addToast('Staff member added successfully!', 'success');
      closeStaffModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to add staff member', 'error');
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: ({ id, updatedStaff }) => api.put(`/rbac/staff/${id}`, updatedStaff),
    onSuccess: () => {
      queryClient.invalidateQueries(['staff']);
      addToast('Staff member updated successfully!', 'success');
      closeStaffModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update staff member', 'error');
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: (id) => api.delete(`/rbac/staff/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['staff']);
      addToast(res.data.message || 'Staff profile deactivated successfully', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to deactivate staff member', 'error');
    }
  });

  // Mutations - Roles
  const createRoleMutation = useMutation({
    mutationFn: (newRole) => api.post('/rbac/roles', newRole),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      addToast('Custom role created successfully!', 'success');
      closeRoleModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to create role', 'error');
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, updatedRole }) => api.put(`/rbac/roles/${id}`, updatedRole),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      addToast('Custom role updated successfully!', 'success');
      closeRoleModal();
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to update role', 'error');
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => api.delete(`/rbac/roles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['roles']);
      addToast('Custom role deleted successfully!', 'success');
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Failed to delete role', 'error');
    }
  });

  // Modal actions - Staff
  const openAddStaffModal = () => {
    setEditingStaff(null);
    setStaffForm({
      name: '',
      email: '',
      password: '',
      phone: '',
      roleId: rolesData.find(r => r.name === 'CASHIER')?.id || rolesData[0]?.id || '',
      status: 'ACTIVE'
    });
    setIsStaffModalOpen(true);
  };

  const openEditStaffModal = (staff) => {
    setEditingStaff(staff);
    setStaffForm({
      name: staff.name,
      email: staff.email,
      password: '', // empty to not update
      phone: staff.phone || '',
      roleId: staff.role.id,
      status: staff.status
    });
    setIsStaffModalOpen(true);
  };

  const closeStaffModal = () => {
    setIsStaffModalOpen(false);
    setEditingStaff(null);
  };

  const handleStaffSubmit = (e) => {
    e.preventDefault();
    if (editingStaff) {
      const payload = { ...staffForm };
      if (!payload.password) delete payload.password; // Don't send empty password
      updateStaffMutation.mutate({ id: editingStaff.id, updatedStaff: payload });
    } else {
      createStaffMutation.mutate(staffForm);
    }
  };

  const handleStaffDelete = (staff) => {
    showConfirm({
      title: 'Remove Staff Account',
      message: `Are you sure you want to remove or deactivate ${staff.name}'s account?`,
      onConfirm: () => deleteStaffMutation.mutate(staff.id)
    });
  };

  // Modal actions - Roles
  const openAddRoleModal = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      permissions: []
    });
    setIsRoleModalOpen(true);
  };

  const openEditRoleModal = (role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      permissions: role.permissions
    });
    setIsRoleModalOpen(true);
  };

  const closeRoleModal = () => {
    setIsRoleModalOpen(false);
    setEditingRole(null);
  };

  const handleRoleSubmit = (e) => {
    e.preventDefault();
    if (editingRole) {
      updateRoleMutation.mutate({ id: editingRole.id, updatedRole: roleForm });
    } else {
      createRoleMutation.mutate(roleForm);
    }
  };

  const handleRoleDelete = (role) => {
    showConfirm({
      title: 'Delete Custom Role',
      message: `Are you sure you want to delete the role "${role.name}"? This cannot be undone.`,
      onConfirm: () => deleteRoleMutation.mutate(role.id)
    });
  };

  const togglePermission = (permKey) => {
    setRoleForm(prev => {
      const isSelected = prev.permissions.includes(permKey);
      const newPerms = isSelected 
        ? prev.permissions.filter(p => p !== permKey)
        : [...prev.permissions, permKey];
      return { ...prev, permissions: newPerms };
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-textPrimary dark:text-white flex items-center gap-2">
            <Shield className="text-primary" /> Staff & Roles
          </h1>
          <p className="text-sm text-textSecondary dark:text-gray-400 mt-1">Enforce role-based access control, manage employee accounts, and customize permissions.</p>
        </div>
        <button
          onClick={activeTab === 'staff' ? openAddStaffModal : openAddRoleModal}
          disabled={(activeTab === 'staff' && rolesData.length === 0)}
          className="flex items-center gap-2 py-2 px-4 rounded-mac-btn bg-primary text-white hover:bg-primary/90 transition text-sm font-medium shadow-mac-subtle dark:shadow-none disabled:opacity-50"
        >
          <Plus size={16} /> {activeTab === 'staff' ? 'Add Staff Member' : 'Create Custom Role'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-separator dark:border-white/10">
        <nav className="flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('staff')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
              activeTab === 'staff'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 hover:border-separator dark:border-white/10'
            }`}
          >
            <Users size={16} />
            <span>Staff Members ({staffData.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-all ${
              activeTab === 'roles'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 hover:border-separator dark:border-white/10'
            }`}
          >
            <ShieldCheck size={16} />
            <span>Roles & Permissions ({rolesData.length})</span>
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      {activeTab === 'staff' ? (
        <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
          {isStaffLoading ? (
            <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading staff directory...</div>
          ) : staffData.length === 0 ? (
            <div className="p-12 text-center text-textSecondary dark:text-gray-400 space-y-3">
              <Users className="mx-auto h-12 w-12 text-textSecondary dark:text-gray-400" />
              <h3 className="text-sm font-medium text-slate-950 dark:text-white">No staff members found</h3>
              <p className="text-sm text-textSecondary dark:text-gray-400">Create staff member accounts to allow cashiers and managers to log in.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-separator dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Email / Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Assigned Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
                {staffData.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-surfaceSolid dark:bg-white/10 flex items-center justify-center font-bold text-textSecondary dark:text-gray-400 border">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-textPrimary dark:text-white">{staff.name}</div>
                          <div className="text-xs text-textSecondary dark:text-gray-400">ID: {staff.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-textPrimary dark:text-white flex items-center gap-1.5">
                        <Mail size={14} className="text-textSecondary dark:text-gray-400" /> {staff.email}
                      </div>
                      {staff.phone && (
                        <div className="text-xs text-textSecondary dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                          <Phone size={12} className="text-textSecondary dark:text-gray-400" /> {staff.phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        staff.role.name === 'OWNER' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                        staff.role.name === 'MANAGER' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        'bg-surfaceSolid dark:bg-white/10 text-textSecondary dark:text-gray-400 border border-separator dark:border-white/10'
                      }`}>
                        <Key size={10} /> {staff.role.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        staff.status === 'ACTIVE' 
                          ? 'bg-green-55 text-green-700' 
                          : 'bg-red-50 text-red-750'
                      }`}>
                        {staff.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button
                        onClick={() => openEditStaffModal(staff)}
                        className="text-primary hover:text-primary/80 transition inline-flex items-center gap-1"
                      >
                        <Edit3 size={15} /> Edit
                      </button>
                      {staff.role.name !== 'OWNER' && (
                        <button
                          onClick={() => handleStaffDelete(staff)}
                          className="text-red-650 hover:text-red-550 transition inline-flex items-center gap-1"
                        >
                          <Trash2 size={15} /> Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-card dark:shadow-none border border-slate-200/80 dark:border-white/10 overflow-hidden">
          {isRolesLoading ? (
            <div className="p-8 text-center text-textSecondary dark:text-gray-400">Loading roles catalog...</div>
          ) : (
            <table className="min-w-full divide-y divide-separator dark:divide-white/10">
              <thead className="bg-slate-50 dark:bg-white/5">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Role Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Assigned Staff Count</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Permissions Summary</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-textSecondary dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-[#1C1C1E] divide-y divide-separator dark:divide-white/10">
                {rolesData.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-primary" />
                        <span className="text-sm font-bold text-textPrimary dark:text-white">{role.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-textSecondary dark:text-gray-400 font-semibold flex items-center gap-1.5">
                        <Users size={16} className="text-textSecondary dark:text-gray-400" /> {role._count?.users || 0} users
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-textSecondary dark:text-gray-400">
                      {role.name === 'OWNER' || role.permissions.includes('*') ? (
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded px-2 py-0.5">
                          Super Administrator (All Access)
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1 max-w-lg">
                          {role.permissions.map(p => (
                            <span key={p} className="text-[10px] bg-surfaceSolid dark:bg-white/10 text-slate-655 border rounded px-1.5 py-0.5">
                              {SYSTEM_PERMISSIONS[p]?.label || p}
                            </span>
                          ))}
                          {role.permissions.length === 0 && (
                            <span className="text-xs text-textSecondary dark:text-gray-400 italic">No permissions assigned</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      {role.name !== 'OWNER' ? (
                        <>
                          <button
                            onClick={() => openEditRoleModal(role)}
                            className="text-primary hover:text-primary/80 transition inline-flex items-center gap-1"
                          >
                            <Edit3 size={15} /> Edit
                          </button>
                          {role._count?.users === 0 && (
                            <button
                              onClick={() => handleRoleDelete(role)}
                              className="text-red-650 hover:text-red-550 transition inline-flex items-center gap-1"
                            >
                              <Trash2 size={15} /> Delete
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-textSecondary dark:text-gray-400 flex items-center gap-1 justify-end">
                          <Info size={12} /> System Protected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">
                {editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}
              </h3>
              <button onClick={closeStaffModal} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleStaffSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Full Name *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                    <User size={16} />
                  </div>
                  <input
                    type="text"
                    required
                    className="pl-10 mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Email Address *</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    required
                    disabled={!!editingStaff}
                    className="pl-10 mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10 disabled:bg-slate-50 dark:bg-white/5 disabled:text-textSecondary dark:text-gray-400"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">
                  {editingStaff ? 'Password (leave blank to keep current)' : 'Password *'}
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingStaff}
                    className="pl-10 pr-10 mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10"
                    value={staffForm.password}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 pt-1 flex items-center text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Phone Number</label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-textSecondary dark:text-gray-400">
                    <Phone size={16} />
                  </div>
                  <input
                    type="text"
                    className="pl-10 mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10"
                    value={staffForm.phone}
                    onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Role *</label>
                <div className="relative z-[80]">
                  <CustomSelect
                    value={staffForm.roleId}
                    onChange={(val) => setStaffForm(prev => ({ ...prev, roleId: val }))}
                    options={rolesData.map(r => ({ value: r.id, label: r.name }))}
                    disabled={editingStaff?.role?.name === 'OWNER'}
                    placeholder="Select Role"
                  />
                </div>
              </div>

              {editingStaff && editingStaff.role.name !== 'OWNER' && (
                <div>
                  <label className="block text-sm font-medium text-textSecondary dark:text-gray-400 mb-1">Status</label>
                  <div className="relative z-[70]">
                    <CustomSelect
                      value={staffForm.status}
                      onChange={(val) => setStaffForm(prev => ({ ...prev, status: val }))}
                      options={[
                        { value: 'ACTIVE', label: 'ACTIVE' },
                        { value: 'INACTIVE', label: 'INACTIVE' }
                      ]}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-separator dark:border-white/10 mt-6">
                <button
                  type="button"
                  onClick={closeStaffModal}
                  className="py-2 px-4 border border-separator dark:border-white/10 rounded-mac-btn text-sm font-medium text-textSecondary dark:text-gray-400 hover:bg-slate-50 dark:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createStaffMutation.isLoading || updateStaffMutation.isLoading}
                  className="py-2 px-4 border border-transparent rounded-mac-btn text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50"
                >
                  {editingStaff ? 'Update Account' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 h-full !mt-0">
          <div className="bg-white dark:bg-[#282828] backdrop-blur-2xl rounded-mac-card shadow-mac-modal border border-slate-200/80 dark:border-white/10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-separator dark:border-white/10 shrink-0">
              <h3 className="text-lg font-bold text-textPrimary dark:text-white">
                {editingRole ? 'Edit Custom Role' : 'Create Custom Role'}
              </h3>
              <button onClick={closeRoleModal} className="text-textSecondary dark:text-gray-400 hover:text-textSecondary dark:text-gray-400 transition">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary dark:text-gray-400">Role Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ASSISTANT_MANAGER"
                  disabled={editingRole?.name === 'OWNER'}
                  className="mt-1 block w-full rounded-mac-btn border border-separator dark:border-white/10 shadow-mac-subtle dark:shadow-none focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 outline-none h-10"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-textPrimary dark:text-white">Assign Permissions *</label>
                <div className="space-y-2 border rounded-mac-card divide-y bg-slate-50 dark:bg-white/5 max-h-[40vh] overflow-y-auto">
                  {Object.entries(SYSTEM_PERMISSIONS).map(([key, meta]) => {
                    const isChecked = roleForm.permissions.includes(key);
                    return (
                      <div 
                        key={key} 
                        onClick={() => togglePermission(key)}
                        className="p-3 flex items-start gap-3 cursor-pointer hover:bg-white dark:bg-[#1C1C1E] transition-colors"
                      >
                        <div className="mt-0.5 text-primary">
                          {isChecked ? <CheckSquare size={18} /> : <Square size={18} className="text-textSecondary dark:text-gray-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-textPrimary dark:text-white">{meta.label}</div>
                          <div className="text-[11px] text-textSecondary dark:text-gray-400 mt-0.5">{meta.description}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-separator dark:border-white/10 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={closeRoleModal}
                  className="py-2 px-4 border border-separator dark:border-white/10 rounded-mac-btn text-sm font-medium text-textSecondary dark:text-gray-400 hover:bg-slate-50 dark:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRoleMutation.isLoading || updateRoleMutation.isLoading || roleForm.permissions.length === 0}
                  className="py-2 px-4 border border-transparent rounded-mac-btn text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition disabled:opacity-50"
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
