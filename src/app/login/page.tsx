// src/app/login/page.tsx
import { Suspense } from 'react';
import LoginForm from './LoginForm';

// Loading component for the suspense fallback
function LoginLoading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded-full mb-8 mx-auto w-3/4"></div>
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-300 rounded-lg"></div>
            </div>
            <div>
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
              <div className="h-10 bg-gray-300 rounded-lg"></div>
            </div>
            <div className="h-12 bg-gray-300 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}