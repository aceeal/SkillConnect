'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, signOut, useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

const Toast = ({ message, isVisible, onClose, type = 'info' }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Longer timeout for banned message
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  const getToastStyles = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'bg-red-100',
          border: 'border-red-400',
          text: 'text-red-800',
          progressBar: 'bg-red-500'
        };
      case 'success':
        return {
          bg: 'bg-green-100',
          border: 'border-green-400',
          text: 'text-green-800',
          progressBar: 'bg-green-500'
        };
      case 'warning':
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-400',
          text: 'text-yellow-800',
          progressBar: 'bg-yellow-500'
        };
      default:
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-400',
          text: 'text-blue-800',
          progressBar: 'bg-blue-500'
        };
    }
  };

  const styles = getToastStyles();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={`fixed top-4 right-4 max-w-sm p-4 rounded-md shadow-md ${styles.bg} ${styles.border} border ${styles.text} z-50`}
        >
          <div className="flex items-center">
            <div className="flex-1">
              <p className="font-medium">{message}</p>
            </div>
            <button 
              onClick={onClose}
              className={`ml-4 ${styles.text} hover:text-opacity-75`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <motion.div 
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: 5, ease: "linear" }}
            className={`h-1 mt-2 rounded-full ${styles.progressBar}`}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const EyeIcon = ({ isVisible }) => {
  if (isVisible) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
      </svg>
    );
  } else {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
      </svg>
    );
  }
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  
  const [toast, setToast] = useState({
    message: '',
    isVisible: false,
    type: 'info'
  });

  const showToast = (message, type = 'info') => {
    setToast({
      message,
      isVisible: true,
      type
    });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, isVisible: false }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    // Check for banned parameter in URL
    const banned = searchParams.get('banned');
    const shouldSignOut = searchParams.get('signout');
    
    if (banned === 'true') {
      setError('Your account has been banned. Please contact support for assistance.');
      showToast('Your account has been banned. Please contact support for assistance.', 'error');
      
      // If signout parameter is present, sign out the user
      if (shouldSignOut === 'true') {
        signOut({ redirect: false });
      }
    }
    
    // If authenticated and not banned, redirect to home
    if (status === 'authenticated') {
      router.push('/');
    }
  }, [status, router, searchParams]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
  
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
  
      if (result?.error) {
        // Check if error is about banned account
        if (result.error.includes('banned')) {
          setError(result.error);
          showToast(result.error, 'error');
        } else {
          setError(result.error);
        }
        setIsLoading(false);
        return;
      }
  
      if (result.ok) {
        // Get callback URL or default to home
        const callbackUrl = searchParams.get('callbackUrl') || '/';
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    showToast('Password reset functionality is not yet implemented', 'info');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
      }}
    >
      <Toast 
        message={toast.message} 
        isVisible={toast.isVisible} 
        onClose={hideToast}
        type={toast.type}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative"
      >
        <div className="absolute -z-10 top-0 right-0 w-32 h-32 bg-primary opacity-5 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute -z-10 bottom-0 left-0 w-24 h-24 bg-accent opacity-5 rounded-full transform -translate-x-12 translate-y-12"></div>
        
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl font-bold text-center mb-8 text-gray-900"
        >
          Log In
        </motion.h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <label htmlFor="email" className="block text-sm font-medium text-gray-900">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 transition-all duration-300"
              required
              disabled={searchParams.get('banned') === 'true'}
            />
          </motion.div>

          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <label htmlFor="password" className="block text-sm font-medium text-gray-900">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-gray-900 transition-all duration-300"
                required
                disabled={searchParams.get('banned') === 'true'}
                style={{ 
                  WebkitTextSecurity: showPassword ? 'none' : 'disc',
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600 transition-colors duration-200"
                tabIndex={-1}
                disabled={searchParams.get('banned') === 'true'}
              >
                <EyeIcon isVisible={showPassword} />
              </button>
            </div>
            <div className="mt-2 text-right">
              <a 
                href="#" 
                onClick={handleForgotPassword} 
                className="text-sm text-primary hover:underline transition-all duration-300"
              >
                Forgot Password?
              </a>
            </div>
          </motion.div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm text-center p-3 rounded-md ${
                error.includes('banned') 
                  ? 'text-red-700 bg-red-50 border border-red-200' 
                  : 'text-red-500 bg-red-50'
              }`}
            >
              {error}
              {error.includes('banned') && (
                <div className="mt-2 text-xs text-red-600">
                  If you believe this is a mistake, please contact our support team.
                </div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <button
              type="submit"
              disabled={isLoading || searchParams.get('banned') === 'true'}
              className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-300 active:scale-95 active:shadow-inner flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50 ${
                searchParams.get('banned') === 'true'
                  ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                  : 'bg-primary text-white border-primary hover:bg-white hover:text-primary'
              }`}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </span>
              ) : searchParams.get('banned') === 'true' ? (
                "Account Banned"
              ) : (
                "Log In"
              )}
            </button>
          </motion.div>
        </form>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link 
              href="/signup" 
              className={`transition-all duration-300 ${
                searchParams.get('banned') === 'true'
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary hover:underline'
              }`}
            >
              Sign up
            </Link>
          </p>
        </motion.div>

        {/* Support contact for banned users */}
        {searchParams.get('banned') === 'true' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.5 }}
            className="mt-4 p-3 bg-gray-50 rounded-md text-center"
          >
            <p className="text-xs text-gray-600">
              Need help? Contact our support team at{' '}
              <a href="skillconnectcapstone@gmail.com" className="text-primary hover:underline">
                skillconnectcapstone@gmail.com
              </a>
            </p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}