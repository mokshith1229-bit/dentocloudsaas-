
export type UserRole = 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST' | 'ASSISTANT';
export type PaymentMode = 'CASH' | 'UPI' | 'CARD' | 'BANK_TRANSFER';
export type InvoiceStatus = 'PAID' | 'PARTIAL' | 'DUE' | 'CANCELLED';

export interface Clinic {
  id: string;
  name: string;
  location: string;
  phone: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clinicId: string;
  permissions: {
    appointments: boolean;
    billing: boolean;
    reports: boolean;
    clinical: boolean;
  };
}

export interface Patient {
  id: string;
  name: string;
  phone: string;
  email?: string;
  age?: number;
  gender?: 'M' | 'F' | 'O';
  medicalHistory: string[];
  lastVisit?: string;
  visitCount: number;
  assignedDoctorId?: string;
  status: 'ACTIVE' | 'IN_TREATMENT' | 'COMPLETED' | 'INACTIVE';
  recallDate?: string;
  registrationDate?: string;
}

export interface Appointment {
  id: string;
  tokenNumber?: number;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  time: string;
  date: string;
  duration: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  complaint: string;
  billedAmount?: number;
  paidAmount?: number;
  paymentMode?: PaymentMode;
  rescheduled?: boolean;
  lastUpdated?: string;
  rescheduleReason?: string;
  notifications?: {
    whatsapp: boolean;
    sms: boolean;
    email: boolean;
  };
  called?: boolean;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  mode: PaymentMode;
  date: string;
  transactionId?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  date: string;
  totalAmount: number;
  discount: number;
  status: InvoiceStatus;
  items: Array<{ description: string; cost: number }>;
  payments: PaymentRecord[];
}

export interface TreatmentItem {
  id: string;
  toothNumber: string;
  procedure: string;
  cost: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED';
  date: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  medicine: string;
  dosage: string;
  frequency: string;
  duration: string;
  instruction: 'AFTER_FOOD' | 'BEFORE_FOOD';
  price: number;
  date: string;
}

export type LabOrderStatus = 'PENDING_ASSIGNMENT' | 'ASSIGNED' | 'CONFIRMED' | 'COMPLETED';

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  workType: string;
  status: LabOrderStatus;
  dueDate: string;
  cost: number;
  date: string;
  notes?: string;
  vendorId?: string;
  vendorName?: string;
  invoiceFile?: string;
  paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID';
}

export interface RvgImage {
  id: string;
  url: string;
  notes: string;
  date: string;
  tooth?: string;
}

export interface ClinicalCase {
  id: string;
  patientId: string;
  date: string;
  complaint: string;
  medicalHistory: string;
  dentalHistory: string;
  examination: string;
  advice: string;
  treatments: TreatmentItem[];
  prescriptions: Prescription[];
  labOrders: LabOrder[];
  images: RvgImage[];
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  mode: PaymentMode;
  notes: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: 'LAB' | 'SUPPLIER' | 'UTILITIES' | 'SERVICE';
  code: string;
  phone: string;
  balance: number;
  totalDue: number;
  totalPaid: number;
}

export interface VendorInvoice {
  id: string;
  vendorId: string;
  amount: number;
  date: string;
  reference: string;
  status: 'PAID' | 'PARTIAL' | 'DUE';
  notes?: string;
  fileUrl?: string;
}

export interface VendorPayment {
  id: string;
  vendorId: string;
  amount: number;
  date: string;
  mode: PaymentMode;
  notes: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED' | 'FREE_SERVICE';
  value: number;
  expiryDate?: string;
  isActive: boolean;
  usageCount: number;
  minBillValue?: number;
  minVisits?: number;
  applyOn?: 'TOTAL' | 'CONSULTATION' | 'TEST' | 'SERVICE';
  targetService?: string; // For BOGO or Service specific discounts
  freeService?: string;   // For FREE_SERVICE type
}
