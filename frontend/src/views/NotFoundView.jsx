import { useNavigate } from 'react-router-dom';

export default function NotFoundView() {
  const navigate = useNavigate();

  return (
    <div className="app-container">
      <div className="text-center p-16 min-h-[80vh] flex flex-col items-center justify-center">
        <div className="mb-8">
          <div className="text-7xl font-bold text-emerald-600 opacity-30">404</div>
        </div>

        <h1 className="text-4xl font-bold text-slate-800 mb-4">Page Not Found</h1>

        <p className="text-lg text-slate-600 mb-8 max-w-md">
          The page you're looking for doesn't exist. It may have been moved or deleted.
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
          >
            ← Return Home
          </button>
          <button
            onClick={() => navigate('/assessments')}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all hover:scale-105 shadow-lg"
          >
            📈 My Assessments
          </button>
        </div>
      </div>
    </div>
  );
}
