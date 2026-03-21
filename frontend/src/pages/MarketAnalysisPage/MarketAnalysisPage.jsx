import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * MarketAnalysisPage retired.
 * All market intelligence is now on the Dashboard.
 */
export default function MarketAnalysisPage() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, [navigate]);
  return null;
}
