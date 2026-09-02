import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="glass-chrome border-b border-[var(--glass-border)] sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 lg:px-6 h-14">
        {/* Mobile title */}
        <div className="lg:hidden flex items-center gap-3">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center">
            <span className="text-white font-bold text-sm">P</span>
          </div>
          <h1 className="text-headline font-semibold">PrintHub</h1>
        </div>

        {/* Desktop search */}
        <div className="hidden lg:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search products, quotes, jobs..."
              className="glass-input pl-10 py-2 text-sm h-10"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-primary)] rounded-full" />
          </Button>
          <Button variant="ghost" size="icon">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-primary)] to-[#E84530] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </Button>
        </div>
      </div>
    </header>
  );
}
