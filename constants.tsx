
import { Clinic, Appointment, User, Patient, Vendor } from './types';

export const MOCK_CLINICS: Clinic[] = [
  { id: 'c1', name: 'Elite Dental - Downtown', location: 'Main St 101', phone: '+1 234 567 8901' },
  { id: 'c2', name: 'Elite Dental - Westside', location: 'Sunset Blvd 45', phone: '+1 234 567 8902' },
];

export const MOCK_PATIENTS: Patient[] = [
  // Fixed: Added missing visitCount and status properties
  { id: 'p1', name: 'John Doe', phone: '9876543210', medicalHistory: ['Hypertension'], visitCount: 1, status: 'ACTIVE', registrationDate: '2023-10-01' },
  { id: 'p2', name: 'Jane Smith', phone: '9876543210', medicalHistory: [], visitCount: 1, status: 'ACTIVE', registrationDate: '2023-10-15' }, // Multiple patients under same phone
  { id: 'p3', name: 'Mike Ross', phone: '9876543212', medicalHistory: ['Diabetes'], visitCount: 1, status: 'ACTIVE', registrationDate: '2023-10-20' },
  { id: 'p4', name: 'Little Timmy', phone: '9876543210', medicalHistory: [], visitCount: 1, status: 'ACTIVE', registrationDate: '2023-10-25' }, // Another one
];

export const MOCK_DOCTORS: User[] = [
  { id: 'd1', name: 'Dr. Sarah Wilson', email: 'sarah@elite.com', role: 'DOCTOR', clinicId: 'c1', permissions: { appointments: true, billing: false, reports: true, clinical: true } },
  { id: 'd2', name: 'Dr. James Miller', email: 'james@elite.com', role: 'DOCTOR', clinicId: 'c1', permissions: { appointments: true, billing: false, reports: true, clinical: true } },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  // Fixed: Added missing date property
  { id: 'a1', patientId: 'p1', patientName: 'John Doe', doctorId: 'd1', doctorName: 'Dr. Sarah Wilson', time: '09:00 AM', date: '2023-10-25', duration: '30 min', status: 'CHECKED_IN', complaint: 'Toothache' },
  // Fix: Changed 'SCHEDULED' to 'CONFIRMED' to match Appointment status type in types.ts
  { id: 'a2', patientId: 'p2', patientName: 'Jane Smith', doctorId: 'd1', doctorName: 'Dr. Sarah Wilson', time: '10:30 AM', date: '2023-10-25', duration: '45 min', status: 'CONFIRMED', complaint: 'Routine Checkup' },
];

export const TEETH_ADULT = Array.from({ length: 32 }, (_, i) => (i + 1).toString());

export const PROCEDURE_CATALOG = [
  { id: 'pr1', name: 'Composite Filling', cost: 150 },
  { id: 'pr2', name: 'Root Canal Treatment', cost: 450 },
  { id: 'pr3', name: 'Ceramic Crown', cost: 600 },
  { id: 'pr4', name: 'Simple Extraction', cost: 100 },
  { id: 'pr5', name: 'Scaling & Polishing', cost: 80 },
];

export const PHARMACY_CATALOG = [
  { id: 'm1', name: 'Amoxicillin 500mg', dosage: '1 Tab', freq: '1-0-1', price: 12 },
  { id: 'm2', name: 'Paracetamol 650mg', dosage: '1 Tab', freq: '1-1-1', price: 5 },
  { id: 'm3', name: 'Ibuprofen 400mg', dosage: '1 Tab', freq: '0-0-1', price: 8 },
  { id: 'm4', name: 'Metronidazole 400mg', dosage: '1 Tab', freq: '1-1-1', price: 10 },
];

export const MOCK_VENDORS: Vendor[] = [
  // Fixed: Added missing totalDue and totalPaid properties
  { id: 'v1', name: 'Advanced Dental Lab', category: 'LAB', code: 'V-ADL', phone: '555-0101', balance: 450, totalDue: 450, totalPaid: 0 },
  { id: 'v2', name: 'SupplyCo Dental', category: 'SUPPLIER', code: 'V-SUP', phone: '555-0102', balance: 120, totalDue: 120, totalPaid: 0 },
];

export const EXPENSE_CATEGORIES = [
  'Electricity', 'Lab Bill', 'Clinic Rent', 'Staff Salary', 'Materials', 'Marketing', 'Maintenance'
];
