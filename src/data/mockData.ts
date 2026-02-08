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
    manufacturer: createField("Armstrong", 1),
    modelNumber: createField("ULTIMA-2X4-1234", 1), // SKU/model
    tag: createField("C-01", 1), // project tag
    specIdNumber: createField("09 51 00", 1),
    project: createField("Downtown Office", 1),
    finish: createField("White", 1),
    size: createField("2'x4'", 1),
    price: createField("$45.00", 1),
    details: createField("N/A", 1),
    productDocumentId: "doc-1",
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-2",
    itemName: createField("LED Panel Light", 3),
    manufacturer: createField("Lithonia", 3),
    modelNumber: createField("LP-24-LED-4000K", 3),
    tag: createField("L-02", 3),
    specIdNumber: createField("26 51 00", 3),
    project: createField("Downtown Office", 3),
    finish: createField("", 3),
    size: createField("2'x4'", 3),
    price: createField("$142.50", 3),
    details: createField("Dimmable", 3),
    productDocumentId: "doc-2",
    createdAt: new Date("2024-01-16"),
    documentType: "purchase_order",
  },
  {
    id: "prod-3",
    itemName: createField("Porcelain Floor Tile", 2),
    manufacturer: createField("Crossville", 2),
    modelNumber: createField("LMN-2448-GRIGIO", 2),
    tag: createField("F-01", 2),
    specIdNumber: createField("09 30 00", 2),
    project: createField("Tech Campus", 2),
    finish: createField("Grigio", 2),
    size: createField('24"x48"', 2),
    price: createField("$8.25/sf", 2),
    details: createField("Rectified edge", 2),
    productDocumentId: "doc-1",
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-4",
    itemName: createField("Glass Door Hardware", 4),
    manufacturer: createField("Dorma", 4),
    modelNumber: createField("TS93-CLSR", 4),
    tag: createField("D-03", 4),
    specIdNumber: createField("08 71 00", 4),
    project: createField("Downtown Office", 4),
    finish: createField("Satin Chrome", 4),
    size: createField("", 4),
    price: createField("$385.00", 4),
    details: createField("ADA compliant", 4),
    productDocumentId: "doc-3",
    createdAt: new Date("2024-01-17"),
    documentType: "submittal",
  },
  {
    id: "prod-5",
    itemName: createField("Window Shade System", 5),
    manufacturer: createField("MechoShade", 5),
    modelNumber: createField("ESR-1000", 5),
    tag: createField("W-01", 5),
    specIdNumber: createField("12 24 00", 5),
    project: createField("Residential Tower", 5),
    finish: createField("Charcoal", 5),
    size: createField("Custom", 5),
    price: createField("$210.00", 5),
    details: createField("Manual chain", 5),
    productDocumentId: "doc-1",
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-6",
    itemName: createField("Paint System", 6),
    manufacturer: createField("Benjamin Moore", 6),
    modelNumber: createField("AURA-INT-BASE1", 6),
    tag: createField("P-01", 6),
    specIdNumber: createField("09 91 00", 6),
    project: createField("Tech Campus", 6),
    finish: createField("Swiss Coffee", 6),
    size: createField("1 gal", 6),
    price: createField("$68.99/gal", 6),
    details: createField("Low VOC", 6),
    productDocumentId: "doc-1",
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-7",
    itemName: createField("Carpet Tile", 7),
    manufacturer: createField("Interface", 7),
    modelNumber: createField("CT-ASH-2424", 7),
    tag: createField("F-02", 7),
    specIdNumber: createField("09 68 00", 7),
    project: createField("Tech Campus", 7),
    finish: createField("Ash", 7),
    size: createField('24"x24"', 7),
    price: createField("$3.25/sf", 7),
    details: createField("PVC backing", 7),
    productDocumentId: "doc-1",
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-8",
    itemName: createField("Pendant Light Fixture", 3),
    manufacturer: createField("Artemide", 3),
    modelNumber: createField("PEND-12MB-LED", 3),
    tag: createField("L-03", 3),
    specIdNumber: createField("26 51 00", 3),
    project: createField("Downtown Office", 3),
    finish: createField("Matte Black", 3),
    size: createField('12" diameter', 3),
    price: createField("$425.00", 3),
    details: createField("Dimmable, 3000K", 3),
    productDocumentId: "doc-2",
    createdAt: new Date("2024-01-16"),
    documentType: "purchase_order",
  },
  {
    id: "prod-9",
    itemName: createField("Exterior Wall Panel", 7),
    manufacturer: createField("Trespa", 7),
    modelNumber: createField("METEON-4X8-ANTH", 7),
    tag: createField("E-01", 7),
    specIdNumber: createField("07 42 00", 7),
    project: createField("Residential Tower", 7),
    finish: createField("Anthracite", 7),
    size: createField("4'x8'", 7),
    price: createField("$32.00/sf", 7),
    details: createField("UV resistant", 7),
    productDocumentId: "doc-1",
    createdAt: new Date("2024-01-15"),
    documentType: "specification",
  },
  {
    id: "prod-10",
    itemName: createField("Stainless Steel Handrail", 4),
    manufacturer: createField("Wagner", 4),
    modelNumber: createField("HR-SS-1500", 4),
    tag: createField("H-01", 4),
    specIdNumber: createField("05 52 00", 4),
    project: createField("Residential Tower", 4),
    finish: createField("Brushed Stainless", 4),
    size: createField('1.5" diameter', 4),
    price: createField("$42.50/lf", 4),
    details: createField("Wall mount", 4),
    productDocumentId: "doc-3",
    createdAt: new Date("2024-01-17"),
    documentType: "submittal",
  },
];
