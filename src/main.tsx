import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
// Fonts (bundled with the app, so they work offline; both SIL Open Font License):
// - Atkinson Hyperlegible: body text, designed to be easy to read for people with low vision.
// - Zilla Slab: headings, a slab serif that looks like printed forms and documents.
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/400-italic.css';
import '@fontsource/atkinson-hyperlegible/700.css';
import '@fontsource/zilla-slab/600.css';
import '@fontsource/zilla-slab/700.css';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
