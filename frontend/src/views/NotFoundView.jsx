import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundView() {
  const navigate = useNavigate();

  return (
    <div className="text-center p-16 min-h-[80vh] flex flex-col items-center justify-center">
      <div className="mb-8">
        <div className="font-bold text-emerald-600 text-7xl">404</div>
      </div>

      <h1 className="mb-4 text-4xl font-bold text-slate-800">Page Not Found</h1>

      <p className="max-w-md mb-8 text-lg text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist. It may have been moved or deleted.
      </p>

      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 font-semibold text-white transition-all rounded-lg shadow-lg bg-emerald-600 hover:bg-emerald-700 hover:scale-105"
        >
          ← Return Home
        </button>
        <button
          onClick={() => navigate('/assessments')}
          className="px-6 py-3 font-semibold text-white transition-all bg-blue-500 rounded-lg shadow-lg hover:bg-blue-600 hover:scale-105"
        >
          📈 My Assessments
        </button>
      </div>
    </div>
  );
}
