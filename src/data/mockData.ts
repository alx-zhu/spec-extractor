import type { Product, ProductDocument } from "@/types/product";
import type {
  ReductoBBox,
  ReductoCitation,
  ReductoFieldValue,
} from "@/types/reducto";

// Helper to create a field with a mock bbox
// All coordinates are normalized [0, 1] relative to page dimensions
// left: Distance from left edge (0=left margin, 1=right margin)
// top: Distance from top edge (0=top, 1=bottom)
// width: Width as fraction of page width
// height: Height as fraction of page height
function createField(
  value: string,
  page: number = 1,
  bboxOverrides?: Partial<Omit<ReductoBBox, "page">>,
): ReductoFieldValue<string> {
  const defaultBbox: ReductoBBox = {
    left: 0.1,
    top: 0.1,
    width: 0.3,
    height: 0.04,
    page,
  };

  const citation: ReductoCitation = {
    type: "Text",
    content: "",
    confidence: "high",
    bbox: {
      ...defaultBbox,
      ...bboxOverrides,
      page, // Always use the provided page number
    },
  };

  return {
    value,
    citations: [citation],
  };
}

export const mockDocuments: ProductDocument[] = [
  {
    id: "doc-1",
    filename:
      "/Users/azhu/Sabana/Docs for Testing/Gensler_Plastic Laminate Lockers.pdf",
    uploadDate: new Date("2024-01-15"),
    status: "completed",
    type: "specification",
  },
  {
    id: "doc-2",
    filename:
      "/Users/azhu/Sabana/Docs for Testing/Gensler_Frameless Shower Doors.pdf",
    uploadDate: new Date("2024-01-16"),
    status: "completed",
    type: "purchase_order",
  },
  {
    id: "doc-3",
    filename:
      "/Users/azhu/Sabana/Docs for Testing/Gensler_Wood Athletic Flooring.pdf",
    uploadDate: new Date("2024-01-17"),
    status: "completed",
    type: "submittal",
  },
];

export const mockProducts: Product[] = [
  {
    id: "prod-1",
    itemName: createField("Acoustic Ceiling Panel", 1),
    productDescription: createField(
      "Ultima, Fine Fissured, Square Lay-In",
      1,
    ),
    manufacturer: createField("Armstrong", 1),
    tag: createField("C-01", 1),
    specIdNumber: createField("09 51 00", 1),
    project: createField("Downtown Office", 1),
    finish: createField("White", 1),
    size: createField("2'x4'", 1),
    price: createField("$45.00", 1),
    details: createField("N/A", 1),
    productDocumentId: "doc-1",
    reviewed: false,
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-2",
    itemName: createField("LED Panel Light", 3),
    productDescription: createField(
      "LP Series Recessed LED, 4000K, Flat Lens",
      3,
    ),
    manufacturer: createField("Lithonia", 3),
    tag: createField("L-02", 3),
    specIdNumber: createField("26 51 00", 3),
    project: createField("Downtown Office", 3),
    finish: createField("", 3),
    size: createField("2'x4'", 3),
    price: createField("$142.50", 3),
    details: createField("Dimmable", 3),
    productDocumentId: "doc-2",
    reviewed: false,
    createdAt: new Date("2024-01-16"),
    documentType: "purchase_order",
  },
  {
    id: "prod-3",
    itemName: createField("Porcelain Floor Tile", 2),
    productDescription: createField(
      "Laminam Collection, Grigio, Rectified Edge",
      2,
    ),
    manufacturer: createField("Crossville", 2),
    tag: createField("F-01", 2),
    specIdNumber: createField("09 30 00", 2),
    project: createField("Tech Campus", 2),
    finish: createField("Grigio", 2),
    size: createField('24"x48"', 2),
    price: createField("$8.25/sf", 2),
    details: createField("Rectified edge", 2),
    productDocumentId: "doc-1",
    reviewed: false,
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-4",
    itemName: createField("Door Closer", 4),
    productDescription: createField(
      "TS93 Surface-Applied Door Closer, Full Cover",
      4,
    ),
    manufacturer: createField("Dorma", 4),
    tag: createField("D-03", 4),
    specIdNumber: createField("08 71 00", 4),
    project: createField("Downtown Office", 4),
    finish: createField("Satin Chrome", 4),
    size: createField("", 4),
    price: createField("$385.00", 4),
    details: createField("ADA compliant", 4),
    productDocumentId: "doc-3",
    reviewed: false,
    createdAt: new Date("2024-01-17"),
    documentType: "submittal",
  },
  {
    id: "prod-5",
    itemName: createField("Window Shade", 5),
    productDescription: createField(
      "EuroTwill Shade System, Manual Chain Drive",
      5,
    ),
    manufacturer: createField("MechoShade", 5),
    tag: createField("W-01", 5),
    specIdNumber: createField("12 24 00", 5),
    project: createField("Residential Tower", 5),
    finish: createField("Charcoal", 5),
    size: createField("Custom", 5),
    price: createField("$210.00", 5),
    details: createField("Manual chain", 5),
    productDocumentId: "doc-1",
    reviewed: false,
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-6",
    itemName: createField("Interior Paint", 6),
    productDescription: createField(
      "Aura Interior, Matte Finish, Base 1",
      6,
    ),
    manufacturer: createField("Benjamin Moore", 6),
    tag: createField("P-01", 6),
    specIdNumber: createField("09 91 00", 6),
    project: createField("Tech Campus", 6),
    finish: createField("Swiss Coffee", 6),
    size: createField("1 gal", 6),
    price: createField("$68.99/gal", 6),
    details: createField("Low VOC", 6),
    productDocumentId: "doc-1",
    reviewed: false,
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-7",
    itemName: createField("Carpet Tile", 7),
    productDescription: createField(
      "Urban Retreat Collection, Ashlar Layout",
      7,
    ),
    manufacturer: createField("Interface", 7),
    tag: createField("F-02", 7),
    specIdNumber: createField("09 68 00", 7),
    project: createField("Tech Campus", 7),
    finish: createField("Ash", 7),
    size: createField('24"x24"', 7),
    price: createField("$3.25/sf", 7),
    details: createField("PVC backing", 7),
    productDocumentId: "doc-1",
    reviewed: false,
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-8",
    itemName: createField("Pendant Light", 3),
    productDescription: createField(
      "Tolomeo Mega Suspension, LED, Direct/Indirect",
      3,
    ),
    manufacturer: createField("Artemide", 3),
    tag: createField("L-03", 3),
    specIdNumber: createField("26 51 00", 3),
    project: createField("Downtown Office", 3),
    finish: createField("Matte Black", 3),
    size: createField('12" diameter', 3),
    price: createField("$425.00", 3),
    details: createField("Dimmable, 3000K", 3),
    productDocumentId: "doc-2",
    reviewed: false,
    createdAt: new Date("2024-01-16"),
    documentType: "purchase_order",
  },
  {
    id: "prod-9",
    itemName: createField("Exterior Wall Panel", 7),
    productDescription: createField(
      "Meteon Lumen, High Pressure Laminate, FR Grade",
      7,
    ),
    manufacturer: createField("Trespa", 7),
    tag: createField("E-01", 7),
    specIdNumber: createField("07 42 00", 7),
    project: createField("Residential Tower", 7),
    finish: createField("Anthracite", 7),
    size: createField("4'x8'", 7),
    price: createField("$32.00/sf", 7),
    details: createField("UV resistant", 7),
    productDocumentId: "doc-1",
    reviewed: false,
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-10",
    itemName: createField("Handrail", 4),
    productDescription: createField(
      "Stainless Steel Round Rail, Wall-Mounted, Return Ends",
      4,
    ),
    manufacturer: createField("Wagner", 4),
    tag: createField("H-01", 4),
    specIdNumber: createField("05 52 00", 4),
    project: createField("Residential Tower", 4),
    finish: createField("Brushed Stainless", 4),
    size: createField('1.5" diameter', 4),
    price: createField("$42.50/lf", 4),
    details: createField("Wall mount", 4),
    productDocumentId: "doc-3",
    reviewed: false,
    createdAt: new Date("2024-01-17"),
    documentType: "submittal",
  },
];
