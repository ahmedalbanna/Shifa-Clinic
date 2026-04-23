import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { Pill, Search, Plus, AlertTriangle, Calendar, Package, ChevronDown, Filter, X } from 'lucide-react';
import { motion } from 'motion/react';
import { format, addDays, isBefore } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Medicine {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  minStockLevel?: number;
}

interface Batch {
  id: string;
  medicineId: string;
  batchNo: string;
  expiryDate: any;
  stockQuantity: number;
  medicineName?: string;
  minStockLevel?: number;
}

export default function PharmacyPage() {
  const { isRTL } = useSettings();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'expiring' | 'low-stock'>('inventory');

  const fetchData = async () => {
    setLoading(true);
    try {
      const medSnapshot = await getDocs(collection(db, 'medicines'));
      const meds = medSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Medicine));
      setMedicines(meds);

      const batchSnapshot = await getDocs(collection(db, 'batches'));
      const batchData = batchSnapshot.docs.map(doc => {
        const data = doc.data();
        const med = meds.find(m => m.id === data.medicineId);
        return { 
          id: doc.id, 
          ...data, 
          medicineName: med?.name || 'Unknown',
          minStockLevel: med?.minStockLevel || 10
        } as Batch;
      });
      setBatches(batchData);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const expiringBatches = batches.filter(b => {
    const expiry = b.expiryDate?.toDate();
    if (!expiry) return false;
    return isBefore(expiry, addDays(new Date(), 90));
  });

  const lowStockBatches = batches.filter(b => b.stockQuantity <= (b.minStockLevel || 10));

  const displayBatches = activeTab === 'inventory' 
    ? batches 
    : activeTab === 'expiring' 
      ? expiringBatches 
      : lowStockBatches;

  const filteredBatches = displayBatches.filter(b => 
    b.medicineName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.batchNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {isRTL ? 'إدارة الصيدلية' : 'Pharmacy Management'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'تتبع المخزون، تواريخ الصلاحية، وأرقام التشغيلات.' : 'Track inventory, expiry dates, and batch numbers.'}
          </p>
        </div>
        <div className="flex gap-2">
           <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/25">
            <Plus size={20} />
            {isRTL ? 'إضافة دواء' : 'Add Medicine'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'inventory' 
            ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isRTL ? 'المخزون العام' : 'General Inventory'}
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'expiring' 
            ? 'bg-white dark:bg-slate-700 text-amber-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isRTL ? 'تنبيهات الصلاحية' : 'Expiry Alerts'}
          {expiringBatches.length > 0 && <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center animate-pulse">{expiringBatches.length}</span>}
        </button>
        <button
          onClick={() => setActiveTab('low-stock')}
          className={`px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'low-stock' 
            ? 'bg-white dark:bg-slate-700 text-red-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {isRTL ? 'نقص المخزون' : 'Low Stock'}
          {lowStockBatches.length > 0 && <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center animate-pulse">{lowStockBatches.length}</span>}
        </button>
      </div>

      <div className="panel overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 start-3 my-auto text-slate-400" size={18} />
            <input
              type="text"
              placeholder={isRTL ? 'البحث عن دواء أو رقم تشغيلة...' : 'Search for medicine or batch...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-all">
            <Filter size={18} />
            {isRTL ? 'المجموعة' : 'Category'}
            <ChevronDown size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="px-6 py-4 text-start">{isRTL ? 'الدواء' : 'Medicine'}</th>
                <th className="px-6 py-4 text-start">{isRTL ? 'رقم التشغيلة' : 'Batch No.'}</th>
                <th className="px-6 py-4 text-start">{isRTL ? 'تاريخ الانتهاء' : 'Expiry Date'}</th>
                <th className="px-6 py-4 text-start">{isRTL ? 'الكمية المتوفرة' : 'Stock'}</th>
                <th className="px-6 py-4 text-start">{isRTL ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                 <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">{isRTL ? 'جاري التحميل...' : 'Loading inventory...'}</td></tr>
              ) : filteredBatches.map((batch) => {
                const isExpiring = isBefore(batch.expiryDate?.toDate(), addDays(new Date(), 90));
                const isExpired = isBefore(batch.expiryDate?.toDate(), new Date());
                
                return (
                  <tr key={batch.id} className="hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                          <Pill size={20} />
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{batch.medicineName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-400">
                        {batch.batchNo}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="text-slate-400" />
                        <span className={isExpired ? 'text-red-600 font-bold' : isExpiring ? 'text-amber-600 font-bold' : 'text-slate-600 dark:text-slate-400'}>
                          {batch.expiryDate?.toDate ? format(batch.expiryDate.toDate(), 'MM/yyyy') : '-'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {batch.stockQuantity}
                    </td>
                    <td className="px-6 py-4">
                      {isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold">
                          <X size={12} /> {isRTL ? 'منتهي' : 'Expired'}
                        </span>
                      ) : batch.stockQuantity <= (batch.minStockLevel || 10) ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-600 text-xs font-bold">
                          <AlertTriangle size={12} /> {isRTL ? 'مخزون منخفض' : 'Low Stock'}
                        </span>
                      ) : isExpiring ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                          <AlertTriangle size={12} /> {isRTL ? 'قريب الانتهاء' : 'Expiring'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                          <Package size={12} /> {isRTL ? 'نشط' : 'Normal'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
