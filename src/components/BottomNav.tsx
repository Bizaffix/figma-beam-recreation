import { Home, Compass, User } from "lucide-react";
import { cn } from "@/lib/utils";

export const BottomNav = () => {
  const navItems = [
    { icon: Compass, label: "Discover", active: true },
    { icon: Home, label: "Home", active: false },
    { icon: User, label: "Profile", active: false },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
              item.active ? "text-accent" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};
