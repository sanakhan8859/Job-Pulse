import { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import { fetchIngestionStatus } from './api/client';

export default function App() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const load = () => fetchIngestionStatus().then(setStatus).catch(() => {});
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar status={status} />
      <Home />
    </div>
  );
}
