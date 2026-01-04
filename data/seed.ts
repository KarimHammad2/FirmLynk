import { ActivityLogEntry, FieldReviewReport, Firm, Invoice, Project, ProjectFile, Proposal, User } from "@/lib/types";

const now = () => new Date().toISOString();

export const seedFirms: Firm[] = [
  {
    id: "firm-1",
    name: "ArcStone Design",
    settings: {
      logoUrl: "/logo-arcstone.svg",
      contactEmail: "hello@arcstone.test",
      contactPhone: "(415) 555-0101",
      address: "500 Market St, San Francisco, CA",
    },
  },
  {
    id: "firm-2",
    name: "Vertex Engineering",
    settings: {
      logoUrl: "/logo-vertex.svg",
      contactEmail: "contact@vertex.test",
      contactPhone: "(206) 555-2300",
      address: "1200 Pine Ave, Seattle, WA",
    },
  },
];

export const seedUsers: User[] = [
  { id: "u-admin-1", name: "Alex Rivera", email: "alex@arcstone.test", role: "admin", firmId: "firm-1" },
  { id: "u-staff-1", name: "Jamie Chen", email: "jamie@arcstone.test", role: "staff", firmId: "firm-1" },
  { id: "u-client-1", name: "Casey Morgan", email: "casey@clientco.test", role: "client", firmId: "firm-1" },
  { id: "u-admin-2", name: "Priya Nair", email: "priya@vertex.test", role: "admin", firmId: "firm-2" },
  { id: "u-staff-2", name: "Lee Thompson", email: "lee@vertex.test", role: "staff", firmId: "firm-2" },
  { id: "u-client-2", name: "Taylor Brooks", email: "taylor@citybuild.test", role: "client", firmId: "firm-2" },
];

const baseActivity = (): ActivityLogEntry => ({
  id: crypto.randomUUID(),
  type: "project",
  message: "Project created",
  createdAt: now(),
  userId: "u-admin-1",
});

export const seedProjects: Project[] = [
  {
    id: "proj-1",
    firmId: "firm-1",
    name: "Civic Center Renovation",
    description: "Renovation and seismic retrofit of the downtown civic center.",
    status: "active",
    clientIds: ["u-client-1"],
    internalNotes: "Coordinate weekly with city permitting office.",
    activityLog: [baseActivity()],
  },
  {
    id: "proj-2",
    firmId: "firm-1",
    name: "Lakeside Mixed-Use",
    description: "Mixed-use development with retail podium and residential tower.",
    status: "planning",
    clientIds: [],
    internalNotes: "Evaluate curtain wall vendors.",
    activityLog: [baseActivity()],
  },
];

export const seedFiles: ProjectFile[] = [
  {
    id: "file-1",
    projectId: "proj-1",
    fileName: "Site-Photos.zip",
    fileType: "zip",
    url: "/files/site-photos.zip",
    uploadedBy: "u-staff-1",
    uploadedAt: now(),
  },
];

export const seedProposals: Proposal[] = [
  {
    id: "prop-1",
    projectId: "proj-1",
    firmId: "firm-1",
    clientId: "u-client-1",
    title: "Schematic Design Services",
    description: "Scope includes programming, schematic design, and coordination meetings.",
    lineItems: [
      { id: "li-1", description: "Programming workshops", quantity: 4, unitPrice: 2500 },
      { id: "li-2", description: "Schematic design package", quantity: 1, unitPrice: 18000 },
    ],
    total: 28000,
    status: "sent",
    createdAt: now(),
    updatedAt: now(),
    sentAt: now(),
    auditLog: [
      {
        id: crypto.randomUUID(),
        type: "proposal",
        message: "Proposal sent to client",
        createdAt: now(),
        userId: "u-admin-1",
        relatedEntity: { id: "prop-1", entityType: "proposal" },
      },
    ],
  },
];

export const seedInvoices: Invoice[] = [
  {
    id: "inv-1",
    projectId: "proj-1",
    firmId: "firm-1",
    clientId: "u-client-1",
    proposalId: "prop-1",
    lineItems: [
      { id: "li-3", description: "Design milestone 1", quantity: 1, unitPrice: 12000 },
      { id: "li-4", description: "Consultant coordination", quantity: 10, unitPrice: 350 },
    ],
    total: 15500,
    taxes: 0,
    description: "Design milestone invoice",
    notes: "Payable net 30.",
    status: "sent",
    createdAt: now(),
    updatedAt: now(),
    sentAt: now(),
    auditLog: [
      {
        id: crypto.randomUUID(),
        type: "invoice",
        message: "Invoice sent to client",
        createdAt: now(),
        userId: "u-admin-1",
        relatedEntity: { id: "inv-1", entityType: "invoice" },
      },
    ],
  },
];

export const seedFieldReports: FieldReviewReport[] = [
  {
    id: "fr-1",
    projectId: "proj-1",
    firmId: "firm-1",
    clientId: "u-client-1",
    title: "Field Observation #1",
    userEnteredNotes: "Observed rebar placement at podium level. Minor adjustments needed at grid C5.",
    aiDraftNarrative:
      "During the site visit, rebar placement at the podium level was reviewed. Minor adjustments were recommended at grid C5 to maintain cover. Contractor acknowledged and will adjust prior to concrete pour.",
    photos: [
      { id: "ph-1", url: "/placeholder.png", caption: "Rebar at grid C5" },
      { id: "ph-2", url: "/placeholder.png", caption: "Podium formwork" },
    ],
    disclaimers: [
      "This field review is limited to areas observed during the visit.",
      "Contractor remains responsible for means and methods.",
    ],
    status: "approved",
    authorId: "u-staff-1",
    approverId: "u-admin-1",
    createdAt: now(),
    approvedAt: now(),
    auditLog: [
      {
        id: crypto.randomUUID(),
        type: "field-report",
        message: "Report approved",
        createdAt: now(),
        userId: "u-admin-1",
        relatedEntity: { id: "fr-1", entityType: "field-report" },
      },
    ],
  },
];

