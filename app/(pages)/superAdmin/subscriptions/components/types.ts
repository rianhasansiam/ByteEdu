// Shared types for subscription components

export type PlanRecord = {
  id: string;
  name: string;
  price: number;
  billingCycle: string;
  features: string[];
  isActive: boolean;
  createdAt: Date;
}

export type SubscriptionRecord = {
  id: string;
  institutionId: string;
  institution: {
    id: string;
    name: string;
    status: string;
  };
  planId: string;
  plan: {
    id: string;
    name: string;
    price: number;
    billingCycle: string;
  };
  amount: number;
  paymentStatus: string;
  billingCycle: string;
  startDate: Date;
  endDate: Date;
  paidAt: Date | null;
  transactionId: string | null;
  notes: string | null;
  createdAt: Date;
}

export type SubscriptionStats = {
  total: number;
  paid: number;
  due: number;
  overdue: number;
  totalRevenue: number;
  paidAmount: number;
  dueAmount: number;
  totalInstitutions: number;
}

export type SubscriptionFilterState = {
  searchTerm: string;
  statusFilter: string;
  planFilter: string;
  cycleFilter: string;
}

export type InstitutionOption = {
  id: string;
  name: string;
}

export const getStatusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return "bg-green-100 text-green-800";
    case "due":
      return "bg-yellow-100 text-yellow-800";
    case "overdue":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export const getPlanBadge = (plan: string) => {
  switch (plan.toLowerCase()) {
    case "basic":
      return "bg-gray-100 text-gray-700";
    case "professional":
      return "bg-blue-100 text-blue-700";
    case "enterprise":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-indigo-100 text-indigo-700";
  }
};

export const formatCurrency = (amount: number) => {
  return `৳${amount.toLocaleString()}`;
};
