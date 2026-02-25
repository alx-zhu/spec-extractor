import { Upload, Download, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onUploadClick: () => void;
  onExportClick: () => void;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

export function Header({
  onUploadClick,
  onExportClick,
  onSidebarToggle,
  isSidebarOpen,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onSidebarToggle}
            className="text-gray-500 hover:text-gray-700"
            aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Cousins Properties
            </h1>
            <p className="text-sm text-gray-500 font-normal">
              3350 Peachtree Suite 250 Regional Office
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportClick}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button size="sm" onClick={onUploadClick} className="gap-2">
            <Upload className="h-4 w-4" />
            Upload Documents
          </Button>
        </div>
      </div>
    </header>
  );
}
