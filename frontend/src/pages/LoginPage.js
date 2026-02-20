import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

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
    <div className="min-h-screen bg-[#F9F8F6] flex flex-col items-center justify-center p-8">
      {/* Main Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-12">
          <img 
            src="https://customer-assets.emergentagent.com/job_660831f3-d103-4fb3-ae20-d0fe3dd0af53/artifacts/4li3nr0o_hya.png" 
            alt="Hyatt Centric Candolim Goa" 
            className="h-20 mx-auto mb-4"
          />
          <p className="text-sm text-muted-foreground uppercase tracking-widest">Self-Ordering Kiosk</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-sm shadow-lg p-8">
          <h1 className="text-2xl font-serif font-medium text-center mb-8">Welcome Back</h1>
          
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
                  className="w-full pl-12 pr-4 py-4 bg-muted border border-border rounded-sm text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
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
                  className="w-full pl-12 pr-12 py-4 bg-muted border border-border rounded-sm text-base focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
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
              className="w-full bg-accent text-accent-foreground py-4 rounded-sm text-lg font-medium hover:bg-accent/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
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
        <p className="text-sm text-muted-foreground">
          Powered by <span className="font-medium text-foreground">My Geneie</span>
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
