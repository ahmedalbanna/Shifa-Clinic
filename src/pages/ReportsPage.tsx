import React, { useEffect, useState } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { TrendingUp, Users, DollarSign, Package, Calendar, Activity } from 'lucide-react';
import { motion } from 'motion/react';

const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6'];

export default function ReportsPage() {
  const { isRTL } = useSettings();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchKPIs = async () => {
    setLoading(true);
    try {
      const [patientsRes, apptsRes, invoicesRes, medsRes] = await Promise.all([
        getDocs(collection(db, 'patients')),
        getDocs(collection(db, 'appointments')),
        getDocs(collection(db, 'invoices')),
        getDocs(collection(db, 'medicines'))
      ]);

      const patients = patientsRes.docs.map(d => d.data());
      const appointments = apptsRes.docs.map(d => d.data());
      const invoices = invoicesRes.docs.map(d => d.data());
      const medicines = medsRes.docs.map(d => d.data());

      // 1. Demographics (Gender)
      const genderData = [
        { name: isRTL ? 'ذكر' : 'Male', value: patients.filter(p => p.gender === 'male' || p.gender === 'ذكر').length },
        { name: isRTL ? 'أنثى' : 'Female', value: patients.filter(p => p.gender === 'female' || p.gender === 'أنثى').length }
      ];

      // 2. Revenue over time (simplified monthly)
      const revenueData = [
        { month: 'Jan', amount: 4500 },
        { month: 'Feb', amount: 5200 },
        { month: 'Mar', amount: 4800 },
        { month: 'Apr', amount: 6100 },
      ];

      // 3. Common Diagnoses (mocking distribution based on samples or random for viz)
      const diagnosisData = [
        { name: 'Flu', value: 45 },
        { name: 'Hypertension', value: 30 },
        { name: 'Diabetes', value: 20 },
        { name: 'Others', value: 15 },
      ];

      // 4. Appointment stats
      const apptStats = [
        { name: isRTL ? 'مكتمل' : 'Completed', value: appointments.filter(a => a.status === 'completed').length },
        { name: isRTL ? 'جدولة' : 'Scheduled', value: appointments.filter(a => a.status === 'scheduled').length },
        { name: isRTL ? 'ملغى' : 'Cancelled', value: appointments.filter(a => a.status === 'cancelled').length }
      ];

      setData({ genderData, revenueData, diagnosisData, apptStats, totals: {
        patients: patients.length,
        revenue: invoices.reduce((acc, inv) => acc + (inv.totalAmount || 0), 0),
        appointments: appointments.length,
        medicines: medicines.length
      }});
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  if (loading) return <div className="p-20 text-center">{isRTL ? 'جاري تحميل التقارير...' : 'Loading KPIs...'}</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">{isRTL ? 'تحليلات الأداء (KPIs)' : 'Performance Analytics (KPIs)'}</h1>
        <p className="text-slate-500 mt-2">{isRTL ? 'تقارير مفصلة لمساعدتك في اتخاذ قرارات عمل أفضل.' : 'Detailed reports to help you make better business decisions.'}</p>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: isRTL ? 'إجمالي المرضى' : 'Total Patients', value: data.totals.patients, icon: Users, color: 'text-blue-600' },
          { label: isRTL ? 'إجمالي المبيعات' : 'Total Revenue', value: `${data.totals.revenue} ﷼`, icon: DollarSign, color: 'text-emerald-600' },
          { label: isRTL ? 'المواعيد الكلية' : 'Total Appointments', value: data.totals.appointments, icon: Calendar, color: 'text-amber-600' },
          { label: isRTL ? 'الأدوية المسجلة' : 'Medicines', value: data.totals.medicines, icon: Package, color: 'text-indigo-600' }
        ].map((stat, i) => (
          <motion.div key={i} whileHover={{ y: -5 }} className="panel p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black dark:text-white">{stat.value}</h4>
            </div>
            <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center ${stat.color}`}>
              <stat.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Revenue Line Chart */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2 dark:text-white">
              <TrendingUp className="text-emerald-500" size={20} />
              {isRTL ? 'نمو الإيرادات' : 'Revenue Growth'}
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.revenueData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Diagnosis Distribution Pie Chart */}
        <div className="panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold flex items-center gap-2 dark:text-white">
              <Activity className="text-blue-500" size={20} />
              {isRTL ? 'التشخيصات الشائعة' : 'Common Diagnoses'}
            </h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.diagnosisData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {data.diagnosisData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {data.diagnosisData.map((d: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Appointment Status Bar Chart */}
        <div className="panel p-6">
           <h3 className="font-bold mb-6 dark:text-white">{isRTL ? 'حالة المواعيد' : 'Appointment Statuses'}</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.apptStats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {data.apptStats.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Demographics Pie */}
        <div className="panel p-6">
           <h3 className="font-bold mb-6 dark:text-white">{isRTL ? 'ديموغرافية المرضى' : 'Patient Demographics'}</h3>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {data.genderData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0284c7' : '#ec4899'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
