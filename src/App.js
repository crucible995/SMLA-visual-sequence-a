import { useEffect, useState } from 'react';
import VisualSequenceA from './pages/VisualSequenceA/VisualSequenceA';

export default function App() {
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startSequence = (event) => {
      if (event.code !== 'Space') return;
      event.preventDefault();
      setStarted(true);
    };

    window.addEventListener('keydown', startSequence);
    return () => window.removeEventListener('keydown', startSequence);
  }, []);

  if (started) return <VisualSequenceA />;

  return (
    <main
      aria-label="Press space to begin"
      style={{ width: '100vw', height: '100vh', background: '#000' }}
    />
  );
}
