import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSettings } from '../contexts/SettingsContext';
import { User, Phone, Calendar, Clipboard, Save, ArrowLeft, Activity, Stethoscope, Heart, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Patient {
  id: string;
  name: string;
  phone: string;
  gender: string;
  birthDate: any;
  medicalHistory: string;
  pastDiagnoses: string;
  surgeries: string;
  allergies: string;
  familyHistory: string;
}

export default function PatientDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isRTL } = useSettings();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Patient>>({});

  useEffect(() => {
    const fetchPatient = async () => {
      if (!id) return;
      const docRef = doc(db, 'patients', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Patient;
        setPatient(data);
        setFormData(data);
      }
      setLoading(false);
    };
    fetchPatient();
  }, [id]);

  const handleSave = async () => {
    if (!id) return;
    try {
      await updateDoc(doc(db, 'patients', id), formData);
      setPatient({ ...patient, ...formData } as Patient);
      setIsEditing(false);
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-20 text-center">Loading...</div>;
  if (!patient) return <div className="p-20 text-center">Patient not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/patients')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800">
          <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
          {isRTL ? 'العودة للمرضى' : 'Back to Patients'}
        </button>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
        >
          {isEditing ? <Save size={18} /> : <Clipboard size={18} />}
          {isEditing ? (isRTL ? 'حفظ التغييرات' : 'Save Changes') : (isRTL ? 'تعديل السجل' : 'Edit Record')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Info */}
        <div className="panel p-6 space-y-6 self-start">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center text-4xl font-bold mb-4">
              {patient.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold dark:text-slate-100">{patient.name}</h2>
            <p className="text-slate-500 dark:text-slate-400 capitalize">{patient.gender}</p>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Phone size={18} className="text-blue-500" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400">
              <Calendar size={18} className="text-blue-500" />
              <span>{patient.birthDate?.toDate ? format(patient.birthDate.toDate(), 'PPP', { locale: isRTL ? ar : undefined }) : '-'}</span>
            </div>
          </div>
        </div>

        {/* Medical History sections */}
        <div className="lg:col-span-2 space-y-6">
          <div className="panel">
            <div className="panel-header">
               <div className="flex items-center gap-2">
                 <Activity size={20} className="text-blue-500" />
                 <span>{isRTL ? 'التاريخ الطبي الشامل' : 'Comprehensive Medical History'}</span>
               </div>
            </div>
            <div className="p-6 space-y-6">
              {[
                { id: 'medicalHistory', label: isRTL ? 'ملاحظات عامة' : 'General Notes', icon: Clipboard },
                { id: 'pastDiagnoses', label: isRTL ? 'التشخيصات السابقة' : 'Past Diagnoses', icon: Stethoscope },
                { id: 'surgeries', label: isRTL ? 'العمليات الجراحية' : 'Surgeries', icon: Activity },
                { id: 'allergies', label: isRTL ? 'الحساسية' : 'Allergies', icon: AlertCircle, color: 'text-red-500' },
                { id: 'familyHistory', label: isRTL ? 'التاريخ العائلي' : 'Family Medical History', icon: Heart },
              ].map((section) => (
                <div key={section.id} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <section.icon size={16} className={section.color || 'text-blue-500'} />
                    {section.label}
                  </label>
                  {isEditing ? (
                    <textarea
                      value={(formData as any)[section.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [section.id]: e.target.value })}
                      className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all min-h-[100px]"
                    />
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400 min-h-[60px] whitespace-pre-wrap">
                      {(patient as any)[section.id] || (isRTL ? 'لا توجد بيانات' : 'No data recorded')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
