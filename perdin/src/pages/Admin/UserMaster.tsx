import React, { useState, useEffect } from 'react';
import { Plus, Pencil, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import api from '../../api/axios';

// Interfaces for API mappings
interface BackendUser {
  id: number;
  username: string;
  role?: string;   // single string returned by backend, e.g., "ROLE_ADMIN"
  roles?: string[]; // fallback just in case
}

interface UserPayload {
  username: string;
  password?: string; // only for creation
  role: string;      // e.g., "ROLE_ADMIN"
}

const UserMaster: React.FC = () => {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  const initialFormState: UserPayload = {
    username: '',
    password: '',
    role: 'PEGAWAI',
  };
  
  const [formData, setFormData] = useState<UserPayload>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<BackendUser[]>('/api/admin/users');
      setUsers(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data user.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setModalMode('ADD');
    setFormData(initialFormState);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: BackendUser) => {
    setModalMode('EDIT');
    setSelectedUserId(user.id);
    
    // Determine the primary role string and strip ROLE_ prefix so it matches the dropdown
    let currentRole = 'PEGAWAI';
    if (user.role) {
      currentRole = user.role.replace('ROLE_', '');
    } else if (user.roles && user.roles.length > 0) {
      currentRole = user.roles[0].replace('ROLE_', '');
    }

    setFormData({
      username: user.username,
      password: '', // do not prefill password
      role: currentRole,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setSelectedUserId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (modalMode === 'ADD') {
        if (!formData.password) {
          setFormError('Password wajib diisi untuk pembuatan user baru.');
          setIsSubmitting(false);
          return;
        }
        await api.post('/api/admin/users', formData);
      } else {
        // Edit mode: only update role as requested: PUT /api/admin/users/{id}/role
        await api.put(`/api/admin/users/${selectedUserId}/role`, {
          role: formData.role
        });
      }
      handleCloseModal();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRoleDisplay = (roleStr: string) => {
    if (!roleStr) return '-';
    // Remove ROLE_ prefix if exists and replace underscores with space
    return roleStr.replace('ROLE_', '').replace('_', ' ');
  };

  const getDisplayRole = (user: BackendUser) => {
    if (user.role) return formatRoleDisplay(user.role);
    if (user.roles && user.roles.length > 0) return formatRoleDisplay(user.roles[0]);
    return '-';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master User</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola data akun pengguna dan penetapan role sistem.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2 -ml-1" />
            Tambah User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-sm">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>Belum ada data user.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {u.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {u.username}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${getDisplayRole(u) === 'ADMIN' ? 'bg-purple-100 text-purple-800' : ''}
                        ${getDisplayRole(u) === 'PEGAWAI' ? 'bg-blue-100 text-blue-800' : ''}
                        ${getDisplayRole(u) === 'DIVISI SDM' ? 'bg-green-100 text-green-800' : ''}
                      `}>
                        {getDisplayRole(u)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleOpenEditModal(u)}
                        className="text-blue-600 hover:text-blue-900 transition-colors inline-flex items-center"
                        title="Edit Role"
                      >
                        <Pencil className="w-4 h-4 mr-1" />
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {modalMode === 'ADD' ? 'Tambah User Baru' : 'Edit Role User'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {modalMode === 'ADD' 
                      ? 'Buat akun pengguna baru dengan role tertentu.' 
                      : `Mengubah hak akses untuk akun ${formData.username}.`}
                  </p>
                </div>

                {formError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}

                <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
                    <input
                      type="text"
                      name="username"
                      id="username"
                      required
                      disabled={modalMode === 'EDIT'} // Cannot edit username
                      value={formData.username}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder="Masukkan username"
                    />
                  </div>

                  {modalMode === 'ADD' && (
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          id="password"
                          required
                          value={formData.password}
                          onChange={handleInputChange}
                          className="block w-full border border-gray-300 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="••••••••"
                        />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:text-blue-500 transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" aria-hidden="true" />
                            ) : (
                              <Eye className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      id="role"
                      required
                      value={formData.role}
                      onChange={handleInputChange}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="ADMIN">ADMIN</option>
                      <option value="PEGAWAI">PEGAWAI</option>
                      <option value="DIVISI_SDM">DIVISI SDM</option>
                    </select>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <button
                  type="submit"
                  form="user-form"
                  disabled={isSubmitting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMaster;
