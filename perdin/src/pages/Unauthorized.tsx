import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-red-600">
          403 - Akses Ditolak
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Anda tidak memiliki izin untuk mengakses halaman tersebut.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
