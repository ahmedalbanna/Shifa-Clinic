import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Pill, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export default function LoginPage() {
  const { signIn } = useAuth();
  const { isRTL } = useSettings();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 border border-slate-200 dark:border-slate-800"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-500/40">
            <Pill size={36} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            {isRTL ? 'مرحباً بك في شفا' : 'Welcome to Shifa'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs">
            {isRTL ? 'نظام إدارة العيادات والصيدليات المتطور' : 'The advanced clinic and pharmacy management system'}
          </p>

          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-750 transition-all group"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 pointer-events-none" />
            <span>{isRTL ? 'الدخول باستخدام جوجل' : 'Sign in with Google'}</span>
            <LogIn size={18} className="ms-2 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
          
          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 w-full">
            <p className="text-xs text-slate-400">
              {isRTL ? 'بالمتابعة فإنك توافق على شروط الخدمة' : 'By continuing, you agree to the Terms of Service'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
