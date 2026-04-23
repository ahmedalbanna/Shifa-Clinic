import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { Calendar as CalendarIcon, Plus, Clock, User as UserIcon, CheckCircle, XCircle, AlertCircle, LayoutGrid, List, Bell, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isToday, isFuture, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  dateTime: any;
  status: 'scheduled' | 'consulting' | 'completed' | 'cancelled';
  notes?: string;
  reminderSent?: boolean;
}

export default function AppointmentsPage() {
  const { isRTL } = useSettings();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const handleSendReminder = async (appt: Appointment) => {
    setSendingReminder(appt.id);
    try {
      // 1. Log to Firestore
      await addDoc(collection(db, 'reminders'), {
        patientId: appt.patientId,
        appointmentId: appt.id,
        type: 'sms',
        status: 'sent',
        message: `Reminder: You have an appointment at Shifa Clinic on ${format(appt.dateTime.toDate(), 'PPP p')}`,
        sentAt: serverTimestamp()
      });

      // 2. Update Appointment
      await updateDoc(doc(db, 'appointments', appt.id), {
        reminderSent: true
      });

      setAppointments(prev => prev.map(a => a.id === appt.id ? { ...a, reminderSent: true } : a));
      alert(isRTL ? 'تم إرسال التذكير بنجاح' : 'Reminder sent successfully');
    } catch (error) {
      console.error(error);
    }
    setSendingReminder(null);
  };
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'upcoming'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'appointments'), orderBy('dateTime', 'asc'));
      const snapshot = await getDocs(q);
      setAppointments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const calendarDays = (() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: isRTL ? 6 : 0 });
    const days = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(start, i));
    }
    return days;
  })();

  const filteredAppointments = appointments.filter(appt => {
    const date = appt.dateTime?.toDate();
    if (!date) return true;
    if (activeFilter === 'today') return isToday(date);
    if (activeFilter === 'upcoming') return isFuture(date);
    return true;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-700';
      case 'consulting': return 'bg-amber-100 text-amber-700';
      case 'completed': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {isRTL ? 'جدول المواعيد' : 'Appointments Schedule'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'متابعة مواعيد المرضى والزيارات القادمة.' : 'Track patient visits and upcoming schedules.'}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <List size={20} />
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-sm' : 'text-slate-500'}`}
            >
              <LayoutGrid size={20} />
            </button>
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25">
            <Plus size={20} />
            {isRTL ? 'موعد جديد' : 'New Appointment'}
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
            {[
              { id: 'all', label: isRTL ? 'الكل' : 'All' },
              { id: 'today', label: isRTL ? 'اليوم' : 'Today' },
              { id: 'upcoming', label: isRTL ? 'القادمة' : 'Upcoming' }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                  activeFilter === filter.id 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full py-20 text-center text-slate-400">
                 <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                 {isRTL ? 'جاري تحميل المواعيد...' : 'Loading schedule...'}
              </div>
            ) : filteredAppointments.length > 0 ? filteredAppointments.map((appt, i) => (
              <motion.div
                key={appt.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className={`absolute top-0 start-0 w-1.5 h-full ${
                  appt.status === 'scheduled' ? 'bg-blue-500' : 
                  appt.status === 'consulting' ? 'bg-amber-500' : 
                  appt.status === 'completed' ? 'bg-emerald-500' : 'bg-red-500'
                }`} />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <UserIcon size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100">{appt.patientName}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${getStatusStyle(appt.status)}`}>
                        {appt.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                    <CalendarIcon size={16} className="text-blue-500" />
                    {appt.dateTime?.toDate ? format(appt.dateTime.toDate(), 'PPP', { locale: isRTL ? ar : undefined }) : '-'}
                  </div>
                  <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 text-sm">
                    <Clock size={16} className="text-blue-500" />
                    {appt.dateTime?.toDate ? format(appt.dateTime.toDate(), 'p', { locale: isRTL ? ar : undefined }) : '-'}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  <button className="flex-1 min-w-[100px] py-2 text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors">
                    {isRTL ? 'عرض الملف' : 'View Profile'}
                  </button>
                  {appt.status === 'scheduled' && (
                    <button 
                      onClick={() => handleSendReminder(appt)}
                      disabled={sendingReminder === appt.id || appt.reminderSent}
                      className={cn(
                        "flex-1 min-w-[100px] py-2 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2",
                        appt.reminderSent 
                          ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                          : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                      )}
                    >
                      <Bell size={14} className={sendingReminder === appt.id ? 'animate-bounce' : ''} />
                      {appt.reminderSent ? (isRTL ? 'تم التذكير' : 'Reminded') : (isRTL ? 'إرسال تذكير' : 'Send Reminder')}
                    </button>
                  )}
                  {appt.status === 'scheduled' && (
                    <button className="w-full py-2 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
                      {isRTL ? 'بدأ الكشف' : 'Start Consultation'}
                    </button>
                  )}
                </div>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <CalendarIcon size={48} className="mx-auto mb-4 opacity-10" />
                <p>{isRTL ? 'لا توجد مواعيد مبرمجة' : 'No appointments scheduled'}</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="panel overflow-hidden">
          <div className="panel-header flex items-center justify-between">
             <div className="flex items-center gap-4">
               <span className="font-bold text-lg">{format(currentMonth, 'MMMM yyyy', { locale: isRTL ? ar : undefined })}</span>
             </div>
             <div className="flex gap-2">
                <button onClick={() => setCurrentMonth(addDays(currentMonth, -30))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <XCircle size={20} className={isRTL ? 'rotate-0' : 'rotate-180'} />
                </button>
                <button onClick={() => setCurrentMonth(addDays(currentMonth, 30))} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <CheckCircle size={20} className={isRTL ? 'rotate-180' : 'rotate-0'} />
                </button>
             </div>
          </div>
          <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="py-2 text-center text-xs font-bold text-slate-400 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800">
            {calendarDays.map((day, idx) => {
              const dayAppts = appointments.filter(a => a.dateTime?.toDate && isSameDay(a.dateTime.toDate(), day));
              return (
                <div key={idx} className={`min-h-[100px] p-2 bg-white dark:bg-slate-900 ${!isSameDay(day, currentMonth) && 'opacity-30'}`}>
                  <span className={`text-xs font-bold ${isToday(day) ? 'bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full' : 'text-slate-400'}`}>
                    {format(day, 'd')}
                  </span>
                  <div className="mt-2 space-y-1">
                    {dayAppts.map(a => (
                      <div key={a.id} className={`text-[10px] p-1 rounded border-s-2 truncate ${
                        a.status === 'scheduled' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      }`}>
                        {format(a.dateTime.toDate(), 'HH:mm')} - {a.patientName}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
