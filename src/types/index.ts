export interface Client {
  id: string;
  name: string;
  phone: string;
  personType: 'fisica' | 'juridica';
  document: string;
  razaoSocial?: string;
  nomeFantasia?: string;
  contact?: string;
  email?: string;
  neighborhood?: string;
  city?: string;
  address?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  personType: 'fisica' | 'juridica';
  document?: string;
  phone?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  notes?: string;
  active: boolean;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  chargeUnit: string;
  measureUnit: string;
  basePrice: number;
  notes?: string;
}

export interface BudgetItem {
  id: string;
  materialId: string;
  materialName: string;
  unit: string;
  width: number;
  height: number;
  qty: number;
  unitPrice: number;
  notes?: string;
  total: number;
}

export interface Budget {
  id: string;
  number: string;
  clientId: string;
  clientName: string;
  validityDate: string;
  deliveryDate: string;
  serviceDescription: string;
  items: BudgetItem[];
  discountType: 'value' | 'percent';
  discountValue: number;
  freight: number;
  otherCosts: number;
  paymentTerms: string;
  generalNotes: string;
  subtotal: number;
  totalDiscount: number;
  total: number;
  status: 'draft' | 'issued' | 'approved' | 'rejected';
  createdAt: string;
}

export interface Payment {
  id: string;
  budgetId: string;
  budgetNumber: string;
  clientName: string;
  amount: number;
  method: string;
  date: string;
  notes?: string;
}

export interface Expense {
  id: string;
  budgetId?: string;
  budgetNumber?: string;
  description: string;
  supplierId?: string;
  supplierName?: string;
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

export interface CompanySettings {
  razaoSocial: string;
  nomeFantasia: string;
  phone: string;
  email: string;
  cnpj: string;
  inscricaoEstadual: string;
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  logo?: string;
  pixQrCode?: string;
  themeColor: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  username: string;
  avatar?: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: string;
}
