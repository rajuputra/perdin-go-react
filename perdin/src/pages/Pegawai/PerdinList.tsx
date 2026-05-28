import React, { useState, useEffect } from 'react';
import { Plus, AlertCircle, Loader2, Calendar, MapPin, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import type { PerdinRequest, PerdinRequestPayload, City } from '../../types';

const PerdinList: React.FC = () => {
  const [requests, setRequests] = useState<PerdinRequest[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const today = new Date().toISOString().split('T')[0];
  const initialFormState: PerdinRequestPayload = {
    purpose: '',
    startDate: today,
    endDate: today,
    originCityId: 0,
    destinationCityId: 0,
  };
  const [formData, setFormData] = useState<PerdinRequestPayload>(initialFormState);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch both requests and cities concurrently
      const [requestsRes, citiesRes] = await Promise.all([
        api.get<PerdinRequest[]>('/api/perdin/my-requests'),
        api.get<City[]>('/api/cities')
      ]);
      setRequests(requestsRes.data);
      setCities(citiesRes.data);
      
      // Auto-select first city if available
      if (citiesRes.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          originCityId: citiesRes.data[0].id,
          destinationCityId: citiesRes.data.length > 1 ? citiesRes.data[1].id : citiesRes.data[0].id
        }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data. Pastikan server merespon dengan benar.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    setFormError('');
    setSuccessMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Reset to defaults
    setFormData(prev => ({
      ...initialFormState,
      originCityId: cities.length > 0 ? cities[0].id : 0,
      destinationCityId: cities.length > 1 ? cities[1].id : (cities.length > 0 ? cities[0].id : 0)
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.endsWith('Id') ? parseInt(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validations
    if (formData.originCityId === formData.destinationCityId) {
      setFormError('Kota asal dan kota tujuan tidak boleh sama.');
      return;
    }
    if (formData.startDate < today) {
      setFormError('Tanggal keberangkatan tidak boleh di masa lalu.');
      return;
    }
    if (formData.endDate < formData.startDate) {
      setFormError('Tanggal kembali tidak boleh lebih awal dari tanggal keberangkatan.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/api/perdin', formData);
      setSuccessMsg('Pengajuan Perjalanan Dinas berhasil dikirim!');
      handleCloseModal();
      
      // Refresh only requests, we already have cities
      const requestsRes = await api.get<PerdinRequest[]>('/api/perdin/my-requests');
      setRequests(requestsRes.data);
      
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Gagal mengirim pengajuan Perdin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCityName = (cityId: number) => {
    const city = cities.find(c => c.id === cityId);
    return city ? city.name : 'Unknown';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Disetujui</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Ditolak</span>;
      case 'PENDING':
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Menunggu</span>;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengajuan Perjalanan Dinas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Daftar riwayat pengajuan Perdin dan form pengajuan baru.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2 -ml-1" />
            Tambah Perdin
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

      {successMsg && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-md shadow-sm transition-opacity">
          <div className="flex">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div className="ml-3">
              <p className="text-sm text-green-700">{successMsg}</p>
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
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>Belum ada riwayat pengajuan Perdin.</p>
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
                    Tujuan / Keperluan
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      #{req.id}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center text-gray-900 font-medium mb-1">
                        <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                        {req.originCityName} <span className="mx-2 text-gray-400">→</span> {req.destinationCityName}
                      </div>
                      <div className="text-gray-500 truncate max-w-xs" title={req.purpose}>
                        {req.purpose}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(req.startDate)} <span className="mx-1 text-gray-400">-</span> {formatDate(req.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(req.status)}
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
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                    Pengajuan Perjalanan Dinas Baru
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Silakan lengkapi detail perjalanan dinas Anda di bawah ini.
                  </p>
                </div>

                {formError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <p className="text-sm text-red-700">{formError}</p>
                  </div>
                )}

                <form id="perdin-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">Keperluan Perdin</label>
                    <textarea
                      name="purpose"
                      id="purpose"
                      required
                      rows={3}
                      value={formData.purpose}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Contoh: Meeting dengan klien cabang"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="originCityId" className="block text-sm font-medium text-gray-700">Kota Asal</label>
                      <select
                        name="originCityId"
                        id="originCityId"
                        required
                        value={formData.originCityId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {cities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="destinationCityId" className="block text-sm font-medium text-gray-700">Kota Tujuan</label>
                      <select
                        name="destinationCityId"
                        id="destinationCityId"
                        required
                        value={formData.destinationCityId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      >
                        {cities.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Tanggal Keberangkatan</label>
                      <input
                        type="date"
                        name="startDate"
                        id="startDate"
                        required
                        min={today}
                        value={formData.startDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">Tanggal Kembali</label>
                      <input
                        type="date"
                        name="endDate"
                        id="endDate"
                        required
                        min={formData.startDate || today}
                        value={formData.endDate}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                <button
                  type="submit"
                  form="perdin-form"
                  disabled={isSubmitting || cities.length < 2}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Pengajuan'}
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

export default PerdinList;
