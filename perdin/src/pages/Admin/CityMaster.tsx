import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../api/axios';
import type { City, CityPayload } from '../../types';

const initialFormState: CityPayload = {
  name: '',
  latitude: 0,
  longitude: 0,
  province: '',
  island: '',
  isForeign: false,
};

const CityMaster: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'ADD' | 'EDIT'>('ADD');
  const [selectedCityId, setSelectedCityId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CityPayload>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const fetchCities = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get<City[]>('/api/cities');
      setCities(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data kota.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const handleOpenAddModal = () => {
    setModalMode('ADD');
    setFormData(initialFormState);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (city: City) => {
    setModalMode('EDIT');
    setSelectedCityId(city.id);
    setFormData({
      name: city.name,
      latitude: city.latitude,
      longitude: city.longitude,
      province: city.province,
      island: city.island,
      isForeign: city.isForeign,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData(initialFormState);
    setSelectedCityId(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      if (modalMode === 'ADD') {
        await api.post('/api/cities', formData);
      } else {
        await api.put(`/api/cities/${selectedCityId}`, formData);
      }
      handleCloseModal();
      fetchCities();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal menyimpan data kota.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus kota ${name}?`)) {
      return;
    }

    try {
      await api.delete(`/api/cities/${id}`);
      fetchCities();
    } catch (err: any) {
      // Tangkap error jika foreign key terikat atau error lainnya
      const errorMessage = err.response?.data?.message || 'Gagal menghapus kota. Kota mungkin masih digunakan dalam data Perdin.';
      alert(`Error: ${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master Kota</h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola daftar kota asal dan tujuan untuk perjalanan dinas.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2 -ml-1" />
            Tambah Kota
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
        ) : cities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>Belum ada data kota.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nama Kota
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provinsi
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pulau
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Koordinat (Lat, Long)
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Luar Negeri
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {cities.map((city) => (
                  <tr key={city.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {city.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.province}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.island}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {city.isForeign ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Ya
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Tidak
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleOpenEditModal(city)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                        title="Edit Kota"
                      >
                        <Pencil className="w-5 h-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(city.id, city.name)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                        title="Hapus Kota"
                      >
                        <Trash2 className="w-5 h-5 inline" />
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
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    {modalMode === 'ADD' ? 'Tambah Kota Baru' : 'Edit Kota'}
                  </h3>
                  <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-500">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {formError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}

                <form id="city-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nama Kota</label>
                    <input
                      type="text"
                      name="name"
                      id="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Contoh: Jakarta"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="latitude" className="block text-sm font-medium text-gray-700">Latitude</label>
                      <input
                        type="number"
                        step="any"
                        name="latitude"
                        id="latitude"
                        required
                        value={formData.latitude}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="-6.2088"
                      />
                    </div>
                    <div>
                      <label htmlFor="longitude" className="block text-sm font-medium text-gray-700">Longitude</label>
                      <input
                        type="number"
                        step="any"
                        name="longitude"
                        id="longitude"
                        required
                        value={formData.longitude}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="106.8456"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="province" className="block text-sm font-medium text-gray-700">Provinsi</label>
                      <input
                        type="text"
                        name="province"
                        id="province"
                        required
                        value={formData.province}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="DKI Jakarta"
                      />
                    </div>
                    <div>
                      <label htmlFor="island" className="block text-sm font-medium text-gray-700">Pulau</label>
                      <input
                        type="text"
                        name="island"
                        id="island"
                        required
                        value={formData.island}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Jawa"
                      />
                    </div>
                  </div>

                  <div className="flex items-start mt-4">
                    <div className="flex items-center h-5">
                      <input
                        id="isForeign"
                        name="isForeign"
                        type="checkbox"
                        checked={formData.isForeign}
                        onChange={handleInputChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="isForeign" className="font-medium text-gray-700">Luar Negeri</label>
                      <p className="text-gray-500">Centang jika kota ini berada di luar negeri.</p>
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <button
                  type="submit"
                  form="city-form"
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

export default CityMaster;
