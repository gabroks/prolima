import { Client, Supplier, Material, Budget, Payment, Expense, CompanySettings, UserProfile } from "@/types";

export const mockClients: Client[] = [
  { id: "1", name: "João Silva", phone: "(11) 99999-0001", personType: "fisica", document: "123.456.789-00", email: "joao@email.com", neighborhood: "Centro", city: "São Paulo", address: "Rua A, 100", status: "active", createdAt: "2025-01-15" },
  { id: "2", name: "Construtora ABC Ltda", phone: "(11) 3333-4444", personType: "juridica", document: "12.345.678/0001-00", razaoSocial: "Construtora ABC Ltda", nomeFantasia: "ABC Construções", email: "contato@abc.com", neighborhood: "Industrial", city: "São Paulo", address: "Av. B, 200", status: "active", createdAt: "2025-02-01" },
  { id: "3", name: "Maria Oliveira", phone: "(21) 98888-1234", personType: "fisica", document: "987.654.321-00", email: "maria@email.com", city: "Rio de Janeiro", status: "inactive", createdAt: "2024-12-10" },
];

export const mockSuppliers: Supplier[] = [
  { id: "1", name: "Vidraçaria Premium", personType: "juridica", document: "11.222.333/0001-44", phone: "(11) 5555-1111", email: "vidros@premium.com", city: "São Paulo", active: true },
  { id: "2", name: "Alumínio Express", personType: "juridica", document: "22.333.444/0001-55", phone: "(11) 5555-2222", city: "Guarulhos", active: true },
];

export const mockMaterials: Material[] = [
  { id: "1", name: "Vidro Temperado 8mm", chargeUnit: "m²", measureUnit: "centímetro", basePrice: 280.0 },
  { id: "2", name: "Perfil de Alumínio", chargeUnit: "metro", measureUnit: "metro", basePrice: 45.0 },
  { id: "3", name: "Espelho 4mm", chargeUnit: "m²", measureUnit: "centímetro", basePrice: 180.0 },
];

export const mockBudgets: Budget[] = [
  {
    id: "1", number: "ORC-001", clientId: "1", clientName: "João Silva",
    validityDate: "2025-03-15", deliveryDate: "2025-04-01",
    serviceDescription: "Instalação de box para banheiro em vidro temperado",
    items: [
      { id: "i1", materialId: "1", materialName: "Vidro Temperado 8mm", unit: "m²", width: 120, height: 200, qty: 2, unitPrice: 280, notes: "", total: 1344 },
    ],
    discountType: "value", discountValue: 100, freight: 50, otherCosts: 0,
    paymentTerms: "50% entrada + 50% na entrega",
    generalNotes: "", subtotal: 1344, totalDiscount: 100, total: 1294,
    status: "approved", createdAt: "2025-02-10",
  },
  {
    id: "2", number: "ORC-002", clientId: "2", clientName: "Construtora ABC Ltda",
    validityDate: "2025-03-20", deliveryDate: "2025-04-15",
    serviceDescription: "Fachada em vidro laminado",
    items: [
      { id: "i2", materialId: "1", materialName: "Vidro Temperado 8mm", unit: "m²", width: 300, height: 250, qty: 10, unitPrice: 280, notes: "", total: 21000 },
    ],
    discountType: "percent", discountValue: 5, freight: 500, otherCosts: 200,
    paymentTerms: "3x no boleto",
    generalNotes: "Prazo sujeito a confirmação", subtotal: 21000, totalDiscount: 1050, total: 20650,
    status: "issued", createdAt: "2025-02-12",
  },
  {
    id: "3", number: "ORC-003", clientId: "3", clientName: "Maria Oliveira",
    validityDate: "2025-03-25", deliveryDate: "2025-04-10",
    serviceDescription: "Espelho para sala de estar",
    items: [
      { id: "i3", materialId: "3", materialName: "Espelho 4mm", unit: "m²", width: 200, height: 150, qty: 1, unitPrice: 180, notes: "", total: 540 },
    ],
    discountType: "value", discountValue: 0, freight: 30, otherCosts: 0,
    paymentTerms: "PIX à vista",
    generalNotes: "", subtotal: 540, totalDiscount: 0, total: 570,
    status: "draft", createdAt: "2025-02-14",
  },
];

export const mockPayments: Payment[] = [
  { id: "1", budgetId: "1", budgetNumber: "ORC-001", clientName: "João Silva", amount: 647, method: "PIX", date: "2025-02-11", notes: "Entrada 50%" },
];

export const mockExpenses: Expense[] = [
  { id: "1", budgetId: "1", budgetNumber: "ORC-001", description: "Compra de vidro temperado", supplierId: "1", supplierName: "Vidraçaria Premium", category: "Material", amount: 800, date: "2025-02-12" },
  { id: "2", description: "Aluguel do galpão", category: "Fixo", amount: 2500, date: "2025-02-01" },
];

export const mockCompanySettings: CompanySettings = {
  razaoSocial: "Pro Orçamento Ltda",
  nomeFantasia: "Pro Orçamento",
  phone: "(11) 3000-0000",
  email: "contato@proorcamento.com.br",
  cnpj: "00.000.000/0001-00",
  inscricaoEstadual: "123.456.789.000",
  street: "Rua Exemplo, 123",
  neighborhood: "Centro",
  city: "São Paulo",
  state: "SP",
  cep: "01000-000",
  themeColor: "green",
};

export const mockUser: UserProfile = {
  id: "1",
  name: "Admin Pro Orçamento",
  email: "admin@proorcamento.com.br",
  phone: "(11) 99999-0000",
  username: "admin",
};
