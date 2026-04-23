import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { Users, Calendar, Pill, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Stat {
  label: string;
  value: number | string;
  icon: any;
  color: string;
}

export default function Dashboard() {
  const { isRTL } = useSettings();
  const [stats, setStats] = useState<Stat[]>([]);
  const [recentAppointments, setRecentAppointments] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setStats([
        { label: isRTL ? 'مرضى اليوم' : 'Patients Today', value: 24, icon: Users, color: 'text-slate-900 border-slate-200' },
        { label: isRTL ? 'وصفات صادرة' : 'E-Prescriptions', value: 12, icon: Pill, color: 'text-emerald-600 border-slate-200' },
        { label: isRTL ? 'أدوية منتهية قريباً' : 'Expiring Soon', value: 8, icon: AlertTriangle, color: 'text-amber-600 border-slate-200' },
        { label: isRTL ? 'دخل العيادة اليوم' : 'Daily Revenue', value: isRTL ? '4,250 ﷼' : 'SAR 4,250', icon: Calendar, color: 'text-slate-900 border-slate-200' },
      ]);

      const q = query(collection(db, 'appointments'), orderBy('dateTime', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      setRecentAppointments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [isRTL]);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[20px]">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800"
          >
            <div className={`stat-value ${stat.color}`}>{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel h-fit">
          <div className="panel-header">
            <span>{isRTL ? 'جدول مواعيد اليوم' : 'Today\'s Appointments'}</span>
            <button className="text-primary text-xs font-semibold hover:underline">
              {isRTL ? '+ موعد جديد' : '+ New Appointment'}
            </button>
          </div>
          <table className="table-auto w-full text-[13px]">
            <thead>
              <tr className="text-slate-500 border-b border-slate-100 dark:border-slate-800">
                <th className="px-5 py-3 text-start font-medium">{isRTL ? 'المريض' : 'Patient'}</th>
                <th className="px-5 py-3 text-start font-medium">{isRTL ? 'التوقيت' : 'Time'}</th>
                <th className="px-5 py-3 text-start font-medium">{isRTL ? 'الحالة' : 'Status'}</th>
                <th className="px-5 py-3 text-end font-medium">{isRTL ? 'الإجراء' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {recentAppointments.length > 0 ? recentAppointments.map((appt) => (
                <tr key={appt.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-900 dark:text-slate-100">{appt.patientName}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {appt.dateTime?.toDate ? format(appt.dateTime.toDate(), 'p', { locale: isRTL ? ar : undefined }) : '10:30 AM'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2">
                       <span className={`w-2 h-2 rounded-full ${
                        appt.status === 'scheduled' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-end">
                    <button className="text-primary font-semibold hover:underline">
                      {isRTL ? 'بدء الفحص' : 'Start Exam'}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                    {isRTL ? 'لا توجد مواعيد اليوم' : 'No appointments today'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="panel flex flex-col">
          <div className="panel-header">
            <span>{isRTL ? 'تنبيهات المخزون (الصيدلية)' : 'Pharmacy Alerts'}</span>
          </div>
          <div className="p-4 flex flex-col gap-3 overflow-y-auto max-h-[400px]">
            {/* Mocked alerts to match design HTML exactly */}
            <div className="border rounded-lg p-3 flex justify-between items-center bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/20">
              <div>
                <div className="font-bold text-sm dark:text-red-400">{isRTL ? 'أوجمنتين 1 جم' : 'Augmentin 1g'}</div>
                <div className="text-xs text-slate-500">Batch: #AUG-9920</div>
              </div>
              <div className="text-end">
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">
                  {isRTL ? 'ينتهي في 5 أيام' : 'Expires in 5d'}
                </span>
                <div className="text-[10px] mt-1 text-slate-500">{isRTL ? 'الكمية: 14 علبة' : 'Stock: 14 pcs'}</div>
              </div>
            </div>

            <div className="border rounded-lg p-3 flex justify-between items-center bg-amber-50 border-amber-100 dark:bg-amber-900/10 dark:border-amber-900/20">
              <div>
                <div className="font-bold text-sm dark:text-amber-400">{isRTL ? 'بانادول اكسترا' : 'Panadol Extra'}</div>
                <div className="text-xs text-slate-500">Batch: #PAN-4431</div>
              </div>
              <div className="text-end">
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold">
                  {isRTL ? 'ينتهي في 22 يوم' : 'Expires in 22d'}
                </span>
                <div className="text-[10px] mt-1 text-slate-500">{isRTL ? 'الكمية: 120 علبة' : 'Stock: 120 pcs'}</div>
              </div>
            </div>
          </div>
          <div className="mt-auto p-4 border-t border-slate-100 dark:border-slate-800">
             <button className="w-full py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
              {isRTL ? 'طلب توريد أدوية' : 'Restock Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
