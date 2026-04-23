import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  Pill, 
  Receipt, 
  LayoutDashboard, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Moon,
  Sun,
  Globe,
  Search,
  BarChart2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const { theme, toggleTheme, language, setLanguage, isRTL } = useSettings();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { name: isRTL ? 'لوحة التحكم' : 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: isRTL ? 'إدارة المرضى' : 'Patients', path: '/patients', icon: Users },
    { name: isRTL ? 'الصيدلية' : 'Pharmacy', path: '/pharmacy', icon: Pill },
    { name: isRTL ? 'الوصفات الطبية' : 'Prescriptions', path: '/prescriptions', icon: ClipboardList },
    { name: isRTL ? 'المواعيد' : 'Appointments', path: '/appointments', icon: Calendar },
    { name: isRTL ? 'الفواتير' : 'Billing', path: '/billing', icon: Receipt },
    { name: isRTL ? 'التقارير' : 'Reports', path: '/reports', icon: BarChart2 },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f8fafc] dark:bg-slate-950">
      {/* Mobile Header */}
      <header className="md:hidden h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Pill className="text-primary" />
          <span className="font-bold text-lg text-secondary dark:text-white">ميدي سيس</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2">
          <Menu />
        </button>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 z-50 w-60 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 transition-transform duration-300 md:relative md:translate-x-0",
        isRTL ? "border-l" : "border-r",
        isSidebarOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full"),
        isRTL ? "right-0" : "left-0"
      )}>
        <div className="flex flex-col h-full py-6">
          <div className="px-6 mb-8">
            <div className="flex items-center gap-2 text-primary dark:text-sky-400 font-bold text-xl">
              <Pill size={24} />
              <span>ميدي سيس</span>
            </div>
          </div>

          <nav className="flex-1 space-y-0">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all group",
                  isActive 
                    ? "sidebar-item-active" 
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 border-e-4 border-transparent"
                )}
              >
                <item.icon size={20} className={cn("transition-transform group-hover:scale-110")} />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 mt-auto border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 px-4 py-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <UserIcon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate dark:text-slate-200">{profile?.displayName}</p>
                <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
              </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-2 gap-1">
              <button 
                onClick={toggleTheme}
                className="flex-1 p-2 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                title={isRTL ? 'تبديل السمة' : 'Toggle Theme'}
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <button 
                onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
                className="flex-1 p-2 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-bold text-xs"
                title={isRTL ? 'تبديل اللغة' : 'Switch Language'}
              >
                <Globe size={18} className="me-1" />
                {language === 'ar' ? 'EN' : 'عربي'}
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 p-2 flex items-center justify-center rounded-lg text-red-500 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                title={isRTL ? 'خروج' : 'Logout'}
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-h-0 bg-[#f8fafc] dark:bg-slate-950 overflow-hidden">
        {/* Header */}
        <header className="hidden md:flex h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 items-center justify-between px-8 shrink-0">
          <div className="relative">
            <Search className="absolute inset-y-0 start-3 my-auto text-slate-400" size={16} />
            <input 
              type="text" 
              className="bg-slate-100 dark:bg-slate-800 border-none rounded-lg py-2 ps-10 pe-4 w-[300px] text-sm focus:ring-0" 
              placeholder={isRTL ? 'بحث عن مريض، دواء، أو موعد...' : 'Search for patient, medicine, or appointment...'}
            />
          </div>
          <div className="flex items-center gap-6">
            <div className="relative cursor-pointer text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs uppercase">
                {profile?.displayName?.charAt(0) || 'U'}
              </div>
              <span className="text-sm font-medium dark:text-slate-200">{profile?.displayName}</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-[1200px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
