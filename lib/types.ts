export type Role = "admin" | "staff" | "client";

export interface FirmSettings {
  logoUrl?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

export interface Firm {
  id: string;
  name: string;
  settings: FirmSettings;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  firmId: string;
}

export type ProjectStatus = "planning" | "active" | "on-hold" | "completed";

export interface ActivityLogEntry {
  id: string;
  type:
    | "project"
    | "proposal"
    | "invoice"
    | "field-report"
    | "file"
    | "status";
  message: string;
  createdAt: string;
  userId: string;
  relatedEntity?: {
    id: string;
    entityType: "project" | "proposal" | "invoice" | "field-report" | "file";
  };
}

export interface Project {
  id: string;
  firmId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  clientIds: string[];
  internalNotes?: string;
  activityLog: ActivityLogEntry[];
}

export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  fileType: string;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export type ProposalStatus = "draft" | "sent";

export interface Proposal {
  id: string;
  projectId: string;
  firmId: string;
  clientId: string;
  title: string;
  description: string;
  lineItems: LineItem[];
  total: number;
  status: ProposalStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  auditLog: ActivityLogEntry[];
}

export type InvoiceStatus = "draft" | "sent" | "paid";

export interface Invoice {
  id: string;
  projectId: string;
  firmId: string;
  clientId: string;
  proposalId?: string;
  lineItems: LineItem[];
  total: number;
  taxes?: number;
  description?: string;
  notes?: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  paidAt?: string;
  auditLog: ActivityLogEntry[];
}

export interface FieldReviewPhoto {
  id: string;
  url: string;
  caption?: string;
}

export type FieldReportStatus = "draft" | "approved" | "sent";

export interface FieldReviewReport {
  id: string;
  projectId: string;
  firmId: string;
  clientId: string;
  title: string;
  userEnteredNotes: string;
  aiDraftNarrative?: string;
  photos: FieldReviewPhoto[];
  disclaimers: string[];
  status: FieldReportStatus;
  authorId: string;
  approverId?: string;
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  sentAt?: string;
  auditLog: ActivityLogEntry[];
}

export interface WithAudit<T> {
  data: T;
  audit: ActivityLogEntry[];
}

