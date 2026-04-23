import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { Users, Search, Plus, X, Phone, User as UserIcon, Calendar, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Patient {
  id: string;
  name: string;
  phone: string;
  gender: string;
  birthDate: any;
  createdAt: any;
}

export default function PatientsPage() {
  const { isRTL } = useSettings();
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '',
    phone: '',
    gender: 'ذكر',
    birthDate: '',
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'patients'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setPatients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Patient)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'patients'), {
        ...newPatient,
        birthDate: new Date(newPatient.birthDate),
        createdAt: serverTimestamp()
      });
      setIsAddModalOpen(false);
      setNewPatient({ name: '', phone: '', gender: 'ذكر', birthDate: '' });
      fetchPatients();
    } catch (error) {
      console.error(error);
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {isRTL ? 'سجل المرضى' : 'Patients Record'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إدارة بيانات المرضى وتاريخهم الطبي.' : 'Manage patient profiles and medical history.'}
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
        >
          <Plus size={20} />
          {isRTL ? 'إضافة مريض' : 'Add Patient'}
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 start-3 my-auto text-slate-400" size={18} />
            <input
              type="text"
              placeholder={isRTL ? 'البحث بالاسم أو رقم الهاتف...' : 'Search by name or phone...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all">
            <Filter size={18} />
            {isRTL ? 'تصفية' : 'Filter'}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-start">{isRTL ? 'المريض' : 'Patient'}</th>
                <th className="px-6 py-4 text-start">{isRTL ? 'الجنس' : 'Gender'}</th>
                <th className="px-6 py-4 text-start">{isRTL ? 'تاريخ الميلاد' : 'Birth Date'}</th>
                <th className="px-6 py-4 text-start">{isRTL ? 'رقم الهاتف' : 'Phone'}</th>
                <th className="px-6 py-4 text-end"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    {isRTL ? 'جاري التحميل...' : 'Loading patients...'}
                  </td>
                </tr>
              ) : filteredPatients.length > 0 ? filteredPatients.map((patient) => (
                <tr 
                  key={patient.id} 
                  onClick={() => navigate(`/patients/${patient.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        {patient.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{patient.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">{patient.gender}</td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                    {patient.birthDate?.toDate ? format(patient.birthDate.toDate(), 'PP', { locale: isRTL ? ar : undefined }) : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-300" />
                      {patient.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-end">
                    <button className="p-2 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-10" />
                    <p>{isRTL ? 'لم يتم العثور على مرضى' : 'No patients found'}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Patient Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold dark:text-slate-100">{isRTL ? 'إضافة مريض جديد' : 'New Patient Profile'}</h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddPatient} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isRTL ? 'الاسم بالكامل' : 'Full Name'}</label>
                  <div className="relative">
                    <UserIcon className="absolute inset-y-0 start-4 my-auto text-slate-400" size={18} />
                    <input
                      required
                      type="text"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      className="w-full ps-12 pe-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      placeholder={isRTL ? 'مثال: أحمد محمد' : 'e.g. John Doe'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isRTL ? 'رقم الهاتف' : 'Phone Number'}</label>
                    <div className="relative">
                      <Phone className="absolute inset-y-0 start-4 my-auto text-slate-400" size={18} />
                      <input
                        required
                        type="tel"
                        value={newPatient.phone}
                        onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                        className="w-full ps-12 pe-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isRTL ? 'تاريخ الميلاد' : 'Birth Date'}</label>
                    <div className="relative">
                      <Calendar className="absolute inset-y-0 start-4 my-auto text-slate-400" size={18} />
                      <input
                        required
                        type="date"
                        value={newPatient.birthDate}
                        onChange={(e) => setNewPatient({ ...newPatient, birthDate: e.target.value })}
                        className="w-full ps-12 pe-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{isRTL ? 'الجنس' : 'Gender'}</label>
                  <div className="flex gap-3">
                    {['ذكر', 'أنثى'].map((gender) => (
                      <button
                        key={gender}
                        type="button"
                        onClick={() => setNewPatient({ ...newPatient, gender })}
                        className={`flex-1 py-3 rounded-2xl border transition-all font-medium ${
                          newPatient.gender === gender 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-600 text-blue-600' 
                          : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        {isRTL ? gender : (gender === 'ذكر' ? 'Male' : 'Female')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 font-bold hover:bg-slate-200 transition-colors"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25"
                  >
                    {isRTL ? 'حفظ المريض' : 'Save Patient'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
