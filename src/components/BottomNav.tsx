import { Home, Compass, User, LayoutDashboard, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  // Different navigation for instructors vs students
  const navItems = role === 'instructor' 
    ? [
        { icon: Search, label: "Browse", path: "/instructor/browse" },
        { icon: LayoutDashboard, label: "Dashboard", path: "/instructor/dashboard" },
        { icon: User, label: "Profile", path: "/profile" },
      ]
    : [
        { icon: Compass, label: "Discover", path: "/discover" },
        { icon: Home, label: "Home", path: "/home" },
        { icon: User, label: "Profile", path: "/profile" },
      ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
            >
              <item.icon className="w-6 h-6" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
