import { Upload, Download, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppView = "dashboard" | "project";

interface HeaderProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
  // Project-only (no-ops on dashboard)
  onUploadClick: () => void;
  onExportClick: () => void;
  onSidebarToggle: () => void;
  isSidebarOpen: boolean;
}

export function Header({
  currentView,
  onViewChange,
  onUploadClick,
  onExportClick,
  onSidebarToggle,
  isSidebarOpen,
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex-shrink-0">
      <div className="flex items-center">
        {/* Left: sidebar toggle (project only) + project info */}
        <div className="flex-1 flex items-center gap-4">
          {currentView === "project" && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onSidebarToggle}
              className="text-gray-500 hover:text-gray-700"
              aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex flex-col gap-1">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
              Cousins Properties
            </h1>
            <p className="text-sm text-gray-500 font-normal">
              3350 Peachtree Suite 250 Regional Office
            </p>
          </div>
        </div>

        {/* Center: pill/segment tab switcher */}
        <div className="bg-gray-100 rounded-lg p-1 flex items-center gap-0.5">
          {(["dashboard", "project"] as AppView[]).map((view) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-150",
                currentView === view
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700",
              )}
            >
              {view === "dashboard" ? "Dashboard" : "Project"}
            </button>
          ))}
        </div>

        {/* Right: action buttons (project only) — flex-1 keeps tabs centered */}
        <div className="flex-1 flex items-center justify-end gap-3">
          {currentView === "project" && (
            <>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
}
