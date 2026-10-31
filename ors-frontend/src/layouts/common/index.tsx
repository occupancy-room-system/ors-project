'use client';

import React from 'react';
import Header from './header';
import Footer from './footer';
import { Toast } from '@/components/toast';
import { AuthModal } from '@/components/auth-modal';

interface CommonLayoutProps {
  children: React.ReactNode;
}

const CommonLayout: React.FC<CommonLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <Toast />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6 pb-24 md:pb-8">
        {children}
      </main>
      <Footer />
      <AuthModal />
    </>
  );
};

export default CommonLayout;

