export type PropertyStatus =
  | 'acquired'
  | 'permitting'
  | 'in_progress'
  | 'punch_list'
  | 'listing'
  | 'sold';

export type JobStatus =
  | 'pending'
  | 'bid_requested'
  | 'bid_received'
  | 'approved'
  | 'in_progress'
  | 'inspection'
  | 'complete'
  | 'paid';

export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'disputed';

export type Property = {
  id: string;
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
  status: PropertyStatus;
  purchase_price: number | null;
  target_sale_price: number | null;
  actual_sale_price: number | null;
  total_budget: number | null;
  total_spent: number | null;
  square_feet: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  hero_image_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Contractor = {
  id: string;
  company_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  trade: string | null;
  license_number: string | null;
  insurance_expiry: string | null;
  rating: number;
  notes: string | null;
  created_at: string;
};

export type Job = {
  id: string;
  property_id: string | null;
  contractor_id: string | null;
  title: string;
  description: string | null;
  trade: string | null;
  status: JobStatus;
  estimated_cost: number | null;
  actual_cost: number | null;
  start_date: string | null;
  due_date: string | null;
  completed_date: string | null;
  notes: string | null;
};

export type Bid = {
  id: string;
  job_id: string;
  contractor_id: string;
  amount: number;
  scope_of_work: string | null;
  estimated_days: number | null;
  status: 'pending' | 'accepted' | 'rejected';
  document_url: string | null;
  submitted_at: string;
};

export type Invoice = {
  id: string;
  job_id: string;
  contractor_id: string;
  amount: number;
  invoice_number: string | null;
  status: InvoiceStatus;
  document_url: string | null;
  submitted_at: string;
  paid_at: string | null;
};

export type BudgetItem = {
  id: string;
  property_id: string;
  category: string;
  estimated: number;
  actual: number;
  notes: string | null;
};

export type ActivityLog = {
  id: string;
  property_id: string | null;
  job_id: string | null;
  actor: string | null;
  action: string;
  details: Record<string, unknown> | null;
  created_at: string;
};
