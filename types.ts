
export type UserRole = 'ADMIN' | 'RESIDENT';

export interface PaymentEntry {
  id: string;
  date: string;
  amount: number;
}

export interface PaymentRequest {
  id: string;
  residentId: string;
  residentName: string;
  amount: number;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface Announcement {
  id: string;
  text: string;
  timestamp: string;
  type: 'INFO' | 'WARNING' | 'ALERT';
}

export interface Room {
  id: string;
  roomNumber: string;
  capacity: number;
  type: 'AC' | 'NON_AC';
}

export interface Hostel {
  id: string;
  hostelNumber: string; // This is the name/number e.g. "Maruti A"
  rooms: Room[];
  totalCapacity: number;
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  contactNumber: string;
  rent: number;
  roomNumber: string;
  hostelNumber: string;
  roomType: 'AC' | 'NON_AC';
  joiningDate: string;
  photo: string; // base64
  idDocument: string; // base64
  password: string;
  username: string;
  paymentStatus: 'PAID' | 'UNPAID' | 'PENDING';
  lastPaymentDate?: string;
  paymentHistory?: PaymentEntry[];
  autoRenew: boolean;
  lastRenewedMonth?: string;
}

export interface Expense {
  id: string;
  date: string;
  category: 'VEGETABLES' | 'MILK' | 'GROCERIES' | 'PETROL' | 'OTHERS';
  amount: number;
  description: string;
}

export interface MenuDay {
  day: string;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export interface ReminderConfig {
  daysBefore: number;
  messageTemplate: string;
}

export interface AuthState {
  user: Resident | { username: string; role: 'ADMIN' } | null;
  role: UserRole | null;
}
