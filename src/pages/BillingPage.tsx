import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { Receipt, Search, Plus, Filter, FileText, User as UserIcon, Calendar, CheckCircle, CreditCard, DollarSign, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  totalAmount: number;
  status: 'pending' | 'paid';
  createdAt: any;
  lineItems: InvoiceItem[];
}

export default function BillingPage() {
  const { isRTL } = useSettings();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const handlePayOnline = async (invoice: Invoice) => {
    setProcessingId(invoice.id);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invoice.id,
          amount: invoice.totalAmount,
          patientName: invoice.patientName
        })
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create payment session');
      }
    } catch (error) {
      console.error(error);
      alert('Error connecting to payment gateway');
    }
    setProcessingId(null);
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      setInvoices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice)));
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {isRTL ? 'إدارة الفواتير والتحصيل' : 'Billing & Payments'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {isRTL ? 'إصدار فواتير الخدمات والأدوية ومتابعة الدفع.' : 'Issue service/medication invoices and track payments.'}
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-semibold hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all">
          <Plus size={20} />
          {isRTL ? 'فاتورة جديدة' : 'New Invoice'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {loading ? (
            <div className="py-20 text-center">Loading invoices...</div>
          ) : invoices.length > 0 ? invoices.map((inv) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="panel overflow-hidden"
            >
              <div className="p-6 flex justify-between items-start border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                    <Receipt size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg dark:text-slate-100">{inv.patientName}</h3>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Calendar size={14} />
                      {inv.createdAt?.toDate ? format(inv.createdAt.toDate(), 'PPP', { locale: isRTL ? ar : undefined }) : '-'}
                    </div>
                  </div>
                </div>
                <div className="text-end">
                   <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
                     {isRTL ? `${inv.totalAmount} ﷼` : `$${inv.totalAmount}`}
                   </div>
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                     inv.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                   }`}>
                     {inv.status}
                   </span>
                   {inv.status === 'pending' && (
                     <button
                       onClick={() => handlePayOnline(inv)}
                       disabled={processingId === inv.id}
                       className="mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 disabled:opacity-50"
                     >
                       <CreditCard size={12} />
                       {processingId === inv.id ? (isRTL ? 'جاري..' : 'Processing..') : (isRTL ? 'دفع إلكتروني' : 'Pay Online')}
                     </button>
                   )}
                </div>
              </div>
              
              <div className="p-6 bg-slate-50/50 dark:bg-slate-850/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-2 text-start font-medium">{isRTL ? 'الوصف' : 'Description'}</th>
                      <th className="py-2 text-center font-medium">{isRTL ? 'الكمية' : 'Qty'}</th>
                      <th className="py-2 text-end font-medium">{isRTL ? 'السعر' : 'Unit'}</th>
                      <th className="py-2 text-end font-medium">{isRTL ? 'المجموع' : 'Subtotal'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {inv.lineItems?.map((item, idx) => (
                      <tr key={idx} className="text-slate-700 dark:text-slate-300">
                        <td className="py-3">{item.description}</td>
                        <td className="py-3 text-center">{item.quantity}</td>
                        <td className="py-3 text-end">{item.unitPrice}</td>
                        <td className="py-3 text-end font-bold">{item.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )) : (
            <div className="panel p-20 text-center text-slate-400">
              <Receipt size={48} className="mx-auto mb-4 opacity-10" />
              <p>{isRTL ? 'لا توجد فواتير مسجلة' : 'No invoices found'}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="panel p-6 bg-blue-600 text-white border-none">
            <h3 className="font-bold text-lg mb-4">{isRTL ? 'ملخص مبيعات اليوم' : 'Daily Summary'}</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl">
                 <span className="text-sm opacity-80">{isRTL ? 'إجمالي المحصل' : 'Total Collected'}</span>
                 <span className="text-xl font-bold">12,450 ﷼</span>
              </div>
              <div className="flex justify-between items-center bg-white/10 p-3 rounded-xl">
                 <span className="text-sm opacity-80">{isRTL ? 'فواتير معلقة' : 'Pending Invoices'}</span>
                 <span className="text-xl font-bold">3,200 ﷼</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
