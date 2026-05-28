import React, { useState, useEffect } from 'react';
import { Eye, CheckCircle, XCircle, Loader2, MapPin, Calendar, AlertCircle } from 'lucide-react';
import api from '../../api/axios';
import type { PerdinRequest } from '../../types';

const ApprovalList: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [requests, setRequests] = useState<PerdinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal Detail State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<PerdinRequest | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRequests = async () => {
    setIsLoading(true);
    setError('');
    try {
      const endpoint = activeTab === 'NEW' ? '/api/perdin?status=PENDING' : '/api/perdin';
      const response = await api.get<PerdinRequest[]>(endpoint);
      setRequests(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengambil data pengajuan Perdin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [activeTab]);

  const handlePreview = async (id: number) => {
    setIsDetailLoading(true);
    setActionError('');
    setIsModalOpen(true);
    try {
      const response = await api.get<PerdinRequest>(`/api/perdin/${id}/detail`);
      setSelectedDetail(response.data);
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Gagal memuat detail pengajuan.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDetail(null);
  };

  const handleAction = async (action: 'approve' | 'reject') => {
    if (!selectedDetail) return;
    setIsSubmitting(true);
    setActionError('');
    
    try {
      await api.put(`/api/perdin/${selectedDetail.id}/${action}`);
      handleCloseModal();
      fetchRequests();
    } catch (err: any) {
      setActionError(err.response?.data?.message || `Gagal memproses pengajuan.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number | null | undefined, currency: string | null | undefined) => {
    if (amount == null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency || 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
  };

  const getAllowanceNotes = (allowance: number | null | undefined, currency: string | null | undefined) => {
    if (currency === 'USD') return '(Luar Negeri)';
    if (allowance === 0) return '(Jarak ≤ 60km)';
    if (allowance === 200000) return '(Jarak > 60km, 1 Provinsi)';
    if (allowance === 250000) return '(Jarak > 60km, Luar Prov, 1 Pulau)';
    if (allowance === 300000) return '(Jarak > 60km, Luar Prov, Luar Pulau)';
    return '';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Approval Perjalanan Dinas</h1>
        <p className="mt-1 text-sm text-gray-500">
          Evaluasi dan berikan persetujuan untuk pengajuan perjalanan dinas pegawai.
        </p>
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

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`${
              activeTab === 'NEW'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            Pengajuan Baru
          </button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`${
              activeTab === 'HISTORY'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
          >
            History Pengajuan
          </button>
        </nav>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>{activeTab === 'NEW' ? 'Tidak ada pengajuan baru yang menunggu approval.' : 'Belum ada riwayat pengajuan.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pegawai
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {req.username}
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handlePreview(req.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors p-2 hover:bg-blue-50 rounded-full"
                        title="Preview Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Approval */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-5 border-b pb-4">
                  <h3 className="text-lg leading-6 font-bold text-gray-900" id="modal-title">
                    Detail Pengajuan Perdin
                  </h3>
                  {selectedDetail && getStatusBadge(selectedDetail.status)}
                </div>

                {actionError && (
                  <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
                    <p className="text-sm text-red-700">{actionError}</p>
                  </div>
                )}

                {isDetailLoading ? (
                  <div className="flex justify-center items-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="ml-3 text-gray-500">Menghitung proyeksi uang saku...</span>
                  </div>
                ) : selectedDetail ? (
                  <div className="space-y-6">
                    {/* User & Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nama Pegawai</p>
                        <p className="mt-1 text-base font-semibold text-gray-900">{selectedDetail.username}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Keperluan</p>
                        <p className="mt-1 text-base text-gray-900">{selectedDetail.purpose}</p>
                      </div>
                    </div>

                    {/* Route Info */}
                    <div className="bg-gray-50 p-4 rounded-lg flex flex-col md:flex-row md:items-center justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-gray-500 uppercase">Kota Asal</p>
                        <p className="mt-1 font-semibold text-gray-900 flex items-center">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {selectedDetail.originCityName}
                        </p>
                      </div>
                      <div className="hidden md:block px-4 text-gray-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                      <div className="flex-1 mt-4 md:mt-0 text-left md:text-right">
                        <p className="text-xs font-medium text-gray-500 uppercase">Kota Tujuan</p>
                        <p className="mt-1 font-semibold text-gray-900 flex items-center md:justify-end">
                          <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                          {selectedDetail.destinationCityName}
                        </p>
                      </div>
                    </div>

                    {/* Date & Metrics Info */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 pt-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tanggal Mulai</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedDetail.startDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tanggal Selesai</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900">{formatDate(selectedDetail.endDate)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Hari</p>
                        <p className="mt-1 text-sm font-semibold text-blue-600">{selectedDetail.duration || 0} Hari</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Jarak Tempuh</p>
                        <p className="mt-1 text-sm font-semibold text-indigo-600">
                          {selectedDetail.distance != null ? `${selectedDetail.distance} KM` : '-'}
                        </p>
                      </div>
                    </div>

                    {/* Financial Projection */}
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
                      <h4 className="text-sm font-bold text-blue-800 mb-3 border-b border-blue-200 pb-2">Proyeksi Biaya Perdin</h4>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-blue-600">Uang Saku Harian</p>
                          <p className="font-medium text-blue-900 flex items-baseline space-x-2">
                            <span>{formatCurrency(selectedDetail.dailyAllowance, selectedDetail.currency)}</span>
                            {selectedDetail.dailyAllowance !== null && (
                              <span className="text-xs font-normal text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                {getAllowanceNotes(selectedDetail.dailyAllowance, selectedDetail.currency)}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-blue-800">Total Uang Saku</p>
                          <p className="text-xl font-black text-blue-700">
                            {formatCurrency(selectedDetail.totalAllowance, selectedDetail.currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
                {selectedDetail && selectedDetail.status === 'PENDING' ? (
                  <>
                    <button
                      type="button"
                      disabled={isSubmitting || isDetailLoading}
                      onClick={() => handleAction('approve')}
                      className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <CheckCircle className="w-5 h-5 mr-2" />}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitting || isDetailLoading}
                      onClick={() => handleAction('reject')}
                      className="mt-3 w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-70"
                    >
                      {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <XCircle className="w-5 h-5 mr-2" />}
                      Reject
                    </button>
                  </>
                ) : null}
                
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:mr-auto sm:w-auto sm:text-sm"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalList;
