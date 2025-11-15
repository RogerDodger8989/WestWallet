import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, useRoutes } from 'react-router-dom';
import { routes } from './app/routes';
import AppShell from './app/AppShell';
import './styles/globals.css';

const App = () => {
  const element = useRoutes([
    {
      path: '/',
      element: <AppShell />,
      children: routes,
    },
  ]);
  return element;
};

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
