import type { JobStatus, PropertyStatus } from './db.types';

const asFiniteNumber = (n: number | null | undefined) =>
  typeof n === 'number' && Number.isFinite(n) ? n : null;

export const money = (n: number | null | undefined) => {
  const value = asFiniteNumber(n);
  if (value == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
};

export const moneyShort = (n: number | null | undefined) => {
  const value = asFiniteNumber(n);
  if (value == null) return '—';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`;
  return `${sign}$${abs.toLocaleString()}`;
};

export const pct = (numerator: number, denom: number) => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denom) || denom <= 0) {
    return 0;
  }
  return Math.min(999, Math.max(0, Math.round((numerator / denom) * 100)));
};

export const signedMoney = (n: number | null | undefined) => {
  const value = asFiniteNumber(n);
  if (value == null) return '—';
  if (value === 0) return money(0);
  return `${value > 0 ? '+' : '-'}${money(Math.abs(value))}`;
};

const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  acquired: 'Acquired',
  permitting: 'Permitting',
  in_progress: 'In Progress',
  punch_list: 'Punch List',
  listing: 'Listing',
  sold: 'Sold',
};

const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: 'Pending',
  bid_requested: 'Bid Requested',
  bid_received: 'Bid Received',
  approved: 'Approved',
  in_progress: 'In Progress',
  inspection: 'Inspection',
  complete: 'Complete',
  paid: 'Paid',
};

export const propertyStatusLabel = (s: PropertyStatus) =>
  PROPERTY_STATUS_LABELS[s] ?? s;

export const jobStatusLabel = (s: JobStatus) => JOB_STATUS_LABELS[s] ?? s;

export const tradeLabel = (t: string | null) => {
  if (!t) return '—';
  return t.charAt(0).toUpperCase() + t.slice(1);
};

export const formatAddress = (p: {
  address: string;
  city: string | null;
  state: string | null;
  zip: string | null;
}) =>
  [p.address, p.city, p.state && p.zip ? `${p.state} ${p.zip}` : p.state]
    .filter(Boolean)
    .join(', ');

export const formatLocation = (p: {
  city: string | null;
  state: string | null;
  zip: string | null;
}) =>
  [p.city, p.state && p.zip ? `${p.state} ${p.zip}` : p.state, !p.state && p.zip]
    .filter(Boolean)
    .join(', ');

export const daysUntil = (iso: string | null | undefined) => {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
};

export const relativeDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const ms = Date.now() - date.getTime();
  const min = 60 * 1000;
  const hr = 60 * min;
  const day = 24 * hr;
  if (ms < 0) return date.toLocaleDateString();
  if (ms < min) return 'just now';
  if (ms < hr) return `${Math.round(ms / min)}m ago`;
  if (ms < day) return `${Math.round(ms / hr)}h ago`;
  if (ms < 7 * day) return `${Math.round(ms / day)}d ago`;
  return date.toLocaleDateString();
};

export const externalUrl = (url: string | null | undefined) => {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};
