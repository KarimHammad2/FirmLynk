import {
  FieldReviewReport,
  Firm,
  Invoice,
  Project,
  ProjectFile,
  Proposal,
  User,
} from "@/lib/types";
import {
  seedFieldReports,
  seedFiles,
  seedFirms,
  seedInvoices,
  seedProjects,
  seedProposals,
  seedUsers,
} from "@/data/seed";

type DbShape = {
  firms: Firm[];
  users: User[];
  projects: Project[];
  files: ProjectFile[];
  proposals: Proposal[];
  invoices: Invoice[];
  fieldReports: FieldReviewReport[];
};

let db: DbShape | null = null;

function cloneSeed<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function initDb(): DbShape {
  return {
    firms: cloneSeed(seedFirms),
    users: cloneSeed(seedUsers),
    projects: cloneSeed(seedProjects),
    files: cloneSeed(seedFiles),
    proposals: cloneSeed(seedProposals),
    invoices: cloneSeed(seedInvoices),
    fieldReports: cloneSeed(seedFieldReports),
  };
}

export function getDb(): DbShape {
  if (!db) {
    db = initDb();
  }
  return db;
}

export function resetDb() {
  db = initDb();
}

