import React from 'react';
import { DatabaseProvider } from './context/DatabaseContext';
import Layout from './components/common/Layout';

export default function App() {
  return (
    <DatabaseProvider>
      <Layout />
    </DatabaseProvider>
  );
}
