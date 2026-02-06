# CLAUDE.md — spec-extractor

## Project Overview

**Sabana Spec Extractor** is a React + TypeScript + Vite web application that extracts architectural product specifications from PDF documents using Reducto AI. Architects upload specification PDFs (purchase orders, specs, drawings, RFIs, submittals), the app extracts product data via AI with citation-backed source locations, and displays results in an interactive table linked to the PDF viewer.

## Tech Stack

- **Framework**: React 19 + TypeScript 5.9
- **Build Tool**: Vite 7 (ES modules)
- **Styling**: Tailwind CSS 4 with CSS variables (oklch color space), `cn()` utility from `tailwind-merge`
- **UI Components**: ShadCN/ui + Radix UI primitives
- **State Management**: TanStack React Query 5 (server state caching)
- **Data Tables**: TanStack React Table 8
- **PDF Viewing**: react-pdf + pdfjs-dist
- **AI Extraction**: Reducto AI SDK (`reductoai`)
- **Backend**: Supabase (storage); localStorage for product/document persistence in dev
- **Icons**: lucide-react

## Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # TypeScript type-check (tsc -b) then Vite production build
npm run lint      # ESLint across all .ts/.tsx files
npm run preview   # Preview production build locally
```

The `build` command runs `tsc -b && vite build` — TypeScript errors will fail the build.

## Project Structure

```
src/
├── api/                    # API integration layers
│   ├── supabase.client.ts  # Supabase initialization
│   ├── reducto.client.ts   # Reducto AI extraction client
│   ├── reducto.prompts.ts  # Extraction schema + system prompts
│   ├── products.api.ts     # Product CRUD (localStorage-backed)
│   ├── documents.api.ts    # Document CRUD (localStorage-backed)
│   └── client.ts           # Async API simulation utilities
├── components/
│   ├── ui/                 # ShadCN/Radix primitives (button, dialog, checkbox, input, badge, select)
│   ├── upload/             # UploadModal, SelectedFile, DocumentTypeSelector
│   ├── export/             # ExportModal (CSV column selection + download)
│   ├── table/              # ProductTable, ProductRow, ProductCell, EditableCell, columns, DocumentTypeBadge
│   ├── pdf-viewer/         # PdfViewer (react-pdf with zoom, navigation, bbox highlighting)
│   ├── panels/             # TablePanel, PdfViewerPanel (layout wrappers)
│   └── Header.tsx          # Top nav with upload/export actions
├── hooks/                  # React Query hooks
│   ├── useProducts.ts      # Product queries + mutations with cache management
│   ├── useDocuments.ts     # Document queries + mutations
│   └── useReductoExtraction.ts  # Reducto extraction mutation
├── types/
│   ├── product.ts          # Product, SpecDocument, DocumentType types + DOCUMENT_TYPES config
│   ├── reducto.ts          # Reducto API response types (ReductoFieldValue, ReductoCitation, etc.)
│   └── table.d.ts          # React Table module augmentation
├── utils/
│   ├── export.ts           # CSV generation logic
│   └── storage.ts          # Supabase Storage upload/download helpers
├── lib/
│   └── utils.ts            # cn() — Tailwind class merger (clsx + tailwind-merge)
├── data/
│   └── mockData.ts         # Mock products/documents for development
├── App.tsx                 # Root component — layout, state, modals, panel coordination
├── main.tsx                # Entry point — React Query provider, ReactDOM mount
└── index.css               # Global styles, Tailwind 4 imports, CSS variables
```

## Architecture & Data Flow

### Entry Point

`index.html` → `src/main.tsx` → `src/App.tsx`

`main.tsx` creates a React Query client (5min stale time, 1 retry) and mounts the app.

### State Management

- **Server state**: React Query handles all product/document data fetching and caching
- **UI state**: React `useState` in `App.tsx` manages selected product, PDF viewer visibility, modal state
- **Persistence**: Currently localStorage (keys: `sabana:products`, `sabana:documents`); Supabase used for PDF file storage

### React Query Cache Keys

```typescript
productKeys = {
  all: ["products"],
  lists: ["products", "list"],
  list: ["products", "list", { filters }],
  byDocument: ["products", "by-document", documentId]
}
```

### Core Workflows

1. **Upload & Extract**: UploadModal → save PDF to Supabase Storage → create document record → Reducto AI extraction → save products → update document status
2. **Browse & View**: ProductTable → select row → PdfViewerPanel opens → auto-navigates to page → highlights field bounding box
3. **Export**: ExportModal → select columns → generate CSV → download

### Key Types

- `Product` extends `ReductoExtractedProduct` with `id`, `specDocumentId`, `documentType`, `createdAt`
- `ReductoFieldValue<T>` wraps each field with `{ value: T, citations: ReductoCitation[] }`
- `ReductoCitation` contains bounding box coordinates (`bbox`) and page numbers for PDF highlighting
- `DocumentType`: `"purchase_order" | "specification" | "drawing" | "rfi" | "submittal"`

## Code Conventions

### TypeScript

- **Strict mode** enabled with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`, `noUncheckedSideEffectImports`
- Path alias: `@/*` maps to `./src/*` — always use `@/` imports
- Target: ES2022, JSX: react-jsx, bundler module resolution

### Naming

- **PascalCase**: Components and type/interface names (`ProductTable.tsx`, `SpecDocument`)
- **camelCase**: Functions, hooks, variables (`useProducts`, `handleRowClick`)
- **UPPER_SNAKE_CASE**: Constants (`PRODUCT_EXTRACTION_SCHEMA`, `STORAGE_BUCKET`, `DOCUMENT_TYPES`)

### React Patterns

- Functional components only (no class components)
- Custom hooks for all data fetching (React Query wrappers in `src/hooks/`)
- `useCallback` for event handlers passed as props
- `useEffect` for side effects (keyboard listeners, etc.)
- Controlled components with `useState`

### Styling

- Tailwind CSS utility classes throughout — no separate CSS files per component
- `cn()` utility for conditional class merging
- CSS variables defined in `src/index.css` for theming
- ShadCN/ui components in `src/components/ui/` follow New York style variant

### File Organization

- Feature-based grouping under `components/` (upload, export, table, pdf-viewer, panels)
- API clients and prompts in `src/api/`
- Types co-located by domain in `src/types/`
- One component per file; component name matches filename

## Linting

ESLint config (`eslint.config.js`):
- `@eslint/js` recommended rules
- `typescript-eslint` recommended rules
- `eslint-plugin-react-hooks` (enforces Rules of Hooks)
- `eslint-plugin-react-refresh` (Vite fast refresh compatibility)
- Ignores: `dist/`

Run `npm run lint` to check. The build does NOT run lint — only `tsc -b` is a build gate.

## Testing

No test framework is currently configured. TypeScript strict mode and ESLint serve as the primary code quality checks.

## Environment & External Services

- **Supabase**: Used for PDF file storage (upload/download). Client initialized in `src/api/supabase.client.ts`
- **Reducto AI**: Document extraction API. Client in `src/api/reducto.client.ts`, schema/prompts in `src/api/reducto.prompts.ts`
- Environment variables are expected for Supabase and Reducto API keys (check `supabase.client.ts` and `reducto.client.ts` for specifics)

## Common Gotchas

- `pdfjs-dist` is pre-bundled in Vite config (`optimizeDeps.include`) to avoid worker initialization issues
- Product field values are wrapped in `ReductoFieldValue<string>` — access the actual string via `.value` and source locations via `.citations`
- The PDF viewer uses bounding box data from Reducto citations to highlight where extracted data appears in the source document
- Mock data in `src/data/mockData.ts` is loaded into localStorage on first run if no data exists
