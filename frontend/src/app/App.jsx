import Providers from './app/Providers.jsx';
import Router from './app/Router.jsx';

export default function App() {
  return (
    <Providers>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        html { -webkit-text-size-adjust: 100%; }
      `}</style>
      <Router />
    </Providers>
  );
}
