import { Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onUploadClick: () => void;
  onExportClick: () => void;
}

export function Header({ onUploadClick, onExportClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4">
      <div className="flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Sabana
          </h1>
          <p className="text-sm text-gray-500 font-normal">
            Extract and analyze architectural specifications
          </p>
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
            Upload Specs
          </Button>
        </div>
      </div>
    </header>
  );
}
