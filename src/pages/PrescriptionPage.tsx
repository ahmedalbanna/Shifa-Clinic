import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { Pill, Search, Plus, Filter, FileText, User as UserIcon, Calendar, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Prescription {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: any;
  status: 'active' | 'dispensed' | 'expired';
  medicines: {
    medicineName: string;
    dosage: string;
    duration: string;
    instructions: string;
  }[];
}

export default function PrescriptionPage() {
  const { isRTL } = useSettings();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'prescriptions'), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      setPrescriptions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prescription)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {isRTL ? 'إدارة الوصفات الطبية' : 'Prescription Management'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'عرض وإدارة وصفات الأدوية للمرضى.' : 'View and manage patient prescriptions.'}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all"
        >
          <Plus size={20} />
          {isRTL ? 'وصفة جديدة' : 'New Prescription'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">Loading...</div>
        ) : prescriptions.map((px) => (
          <motion.div
            key={px.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel p-6 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100">{px.patientName}</h3>
                  <p className="text-xs text-slate-500">{isRTL ? 'بواسطة:' : 'By:'} {px.doctorName}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                px.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {px.status}
              </span>
            </div>

            <div className="space-y-3">
              {px.medicines?.map((med, idx) => (
                <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{med.medicineName}</span>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-lg">{med.dosage}</span>
                  </div>
                  <p className="text-xs text-slate-500 italic">{med.instructions}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Calendar size={14} />
                {px.date?.toDate ? format(px.date.toDate(), 'PPP', { locale: isRTL ? ar : undefined }) : '-'}
              </div>
              <button className="text-primary text-xs font-bold hover:underline">
                {isRTL ? 'طباعة' : 'Print'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
