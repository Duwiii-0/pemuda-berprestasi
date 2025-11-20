import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/authContext';
import { KompetisiProvider } from '../context/KompetisiContext';

interface BracketExportWrapperProps {
  children: React.ReactNode;
}

const BracketExportWrapper: React.FC<BracketExportWrapperProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <KompetisiProvider>
          {children}
        </KompetisiProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default BracketExportWrapper;