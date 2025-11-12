export interface Product {
  id: string;
  itemName: string;
  manufacturer: string;
  specIdNumber: string;
  color: string;
  size: string;
  price: string;
  project: string;
  linkToProduct: string;

  // Source tracking from Reducto
  specDocumentId: string;
  pageNumber: number;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  extractedText: string;

  createdAt: Date;
}

export interface SpecDocument {
  id: string;
  filename: string;
  uploadDate: Date;
  status: "processing" | "completed" | "error";
}
