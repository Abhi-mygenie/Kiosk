import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Eye, EyeOff, LogIn, Check, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Loading Overlay Component
const LoadingOverlay = ({ loginProgress }) => {
  const steps = [
    { key: 'Authenticating', label: 'Authenticating' },
    { key: 'Loading Theme', label: 'Loading Theme' },
    { key: 'Loading Categories', label: 'Loading Categories' },
    { key: 'Loading Menu Items', label: 'Loading Menu Items' },
    { key: 'Loading Tables', label: 'Loading Tables' },
    { key: 'Finalizing', label: 'Finalizing Setup' }
  ];

  const getStepStatus = (stepKey) => {
    const step = loginProgress.steps.find(s => s.step === stepKey);
    return step?.status || 'pending';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-[#F9F8F6] z-50 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-center"
      >
        {/* Logo */}
        <img 
          src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png" 
          alt="Logo" 
          className="h-16 mx-auto mb-8"
        />
        
        {/* Progress Steps */}
        <div className="bg-white rounded-sm shadow-lg p-8 min-w-[320px]">
          <h2 className="text-xl font-heading font-semibold text-blue-dark uppercase tracking-wide mb-6">
            Setting Up Kiosk
          </h2>
          
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.key);
              const isActive = loginProgress.currentStep === step.key || status === 'loading';
              const isDone = status === 'done';
              
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`flex items-center gap-3 ${
                    isDone ? 'text-blue-hero' : isActive ? 'text-blue-dark' : 'text-muted-foreground'
                  }`}
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    {isDone ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 bg-blue-hero rounded-full flex items-center justify-center"
                      >
                        <Check size={12} className="text-white" />
                      </motion.div>
                    ) : isActive ? (
                      <Loader2 size={20} className="animate-spin text-blue-hero" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <span className={`text-sm ${isDone || isActive ? 'font-medium' : ''}`}>
                    {step.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Powered by */}
        <div className="mt-8">
          <img 
            src="https://customer-assets.emergentagent.com/job_f69ca03e-7b5d-4a09-a9a8-bcdd3f3dcbc1/artifacts/c544c78k_mygenie_logo.svg" 
            alt="Powered by MyGenie" 
            className="h-8 mx-auto opacity-50"
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, loginProgress } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(username, password);
      toast.success('Login successful');
    } catch (error) {
      toast.error(error.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      <AnimatePresence>
        {loginProgress.isLoggingIn && (
          <LoadingOverlay loginProgress={loginProgress} />
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-8 overflow-auto">
        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md my-auto"
        >
          {/* Logo */}
          <div className="text-center mb-12">
            <img 
              src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png" 
              alt="Hyatt Centric Candolim Goa" 
              className="h-20 mx-auto mb-4"
            />
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-medium">Self-Ordering Kiosk</p>
          </div>

          {/* Login Card */}
          <div className="bg-white rounded-sm shadow-lg p-8">
            <h1 className="text-3xl font-heading font-semibold text-center mb-8 text-blue-dark uppercase tracking-wide">Welcome Back</h1>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    data-testid="login-username"
                    className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-sm text-base focus:outline-none focus:border-blue-hero focus:ring-1 focus:ring-blue-hero transition-all"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium mb-2 text-muted-foreground">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-muted-foreground" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    data-testid="login-password"
                    className="w-full pl-12 pr-12 py-4 bg-muted border border-border rounded-sm text-base focus:outline-none focus:border-blue-hero focus:ring-1 focus:ring-blue-hero transition-all"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
                    ) : (
                      <Eye size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
                    )}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                data-testid="login-submit"
                className="w-full bg-blue-hero text-white py-4 rounded-sm text-lg font-semibold hover:bg-blue-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={22} />
                    Sign In
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Footer - Powered by My Geneie */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-12 text-center"
        >
          <img 
            src="https://customer-assets.emergentagent.com/job_f69ca03e-7b5d-4a09-a9a8-bcdd3f3dcbc1/artifacts/c544c78k_mygenie_logo.svg" 
            alt="Powered by MyGenie" 
            className="h-10 mx-auto"
          />
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
