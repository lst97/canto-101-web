// Deprecated: Home content moved to file-based components under src/pages/home/* and routed via TanStack Router.
// Kept as a thin wrapper for backward compatibility in dev, delegating to Home.
import type { ReactElement } from 'react';
import './App.css';
import Home from './pages/Home.tsx';

export default function App(): ReactElement {
  return <Home />;
}
