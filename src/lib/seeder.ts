import { collection, addDoc, getDocs, query, limit, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export async function seedInitialData() {
  const patientsCount = (await getDocs(query(collection(db, 'patients'), limit(1)))).size;
  if (patientsCount > 0) return;

  console.log('Seeding initial medical data...');

  // Seed Patients
  const patients = [
    { 
      name: 'أحمد علي', 
      phone: '0123456789', 
      gender: 'ذكر', 
      birthDate: Timestamp.fromDate(new Date(1990, 5, 12)),
      medicalHistory: 'Chronic hypertension managed with medication.',
      allergies: 'Penicillin, Dust',
      pastDiagnoses: 'Hypertension (2018), Type 2 Diabetes (2020)',
      surgeries: 'Appendecomy (2015)'
    },
    { 
      name: 'سارة محمود', 
      phone: '0987654321', 
      gender: 'أنثى', 
      birthDate: Timestamp.fromDate(new Date(1985, 2, 20)),
      allergies: 'Sulfonamides',
      familyHistory: 'Father: Type 2 Diabetes, Mother: Hypertension'
    }
  ];

  const patientIds: string[] = [];
  for (const p of patients) {
    const docRef = await addDoc(collection(db, 'patients'), { ...p, createdAt: serverTimestamp() });
    patientIds.push(docRef.id);
  }

  // Seed Medicines
  const medicines = [
    { name: 'Panadol Advance', price: 25, category: 'مسكنات', unit: 'شريط', minStockLevel: 20 },
    { name: 'Augmentin 1g', price: 90, category: 'مضاد حيوي', unit: 'علبة', minStockLevel: 10 }
  ];

  const medicationList: any[] = [];
  for (const m of medicines) {
    const medRef = await addDoc(collection(db, 'medicines'), { ...m });
    medicationList.push({ id: medRef.id, name: m.name });
    // Seed Batches
    await addDoc(collection(db, 'batches'), {
      medicineId: medRef.id,
      batchNo: 'B12345',
      expiryDate: Timestamp.fromDate(new Date(2027, 4, 23)),
      stockQuantity: 100,
      manufacturer: 'GSK'
    });
  }

  // Seed Prescriptions
  await addDoc(collection(db, 'prescriptions'), {
    patientId: patientIds[0],
    patientName: 'أحمد علي',
    doctorId: 'seed-doctor',
    doctorName: 'د. خالد سليم',
    date: serverTimestamp(),
    status: 'active',
    medicines: [
      { medicineName: 'Panadol Advance', dosage: '500mg', duration: '5 days', instructions: 'Take twice daily after meals' }
    ]
  });

  // Seed Invoices
  await addDoc(collection(db, 'invoices'), {
    patientId: patientIds[0],
    patientName: 'أحمد علي',
    totalAmount: 115,
    status: 'pending',
    createdAt: serverTimestamp(),
    lineItems: [
      { description: 'Consultation Fee', quantity: 1, unitPrice: 90, subtotal: 90 },
      { description: 'Panadol Advance', quantity: 1, unitPrice: 25, subtotal: 25 }
    ]
  });

  // Seed Appointments
  await addDoc(collection(db, 'appointments'), {
    patientId: patientIds[0],
    patientName: 'أحمد علي',
    dateTime: Timestamp.fromDate(new Date()),
    status: 'scheduled',
    notes: 'Follow-up on blood pressure'
  });

  console.log('Seeding complete.');
}
