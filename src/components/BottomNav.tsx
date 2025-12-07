import { Home, Compass, User, LayoutDashboard, Search, Plus } from "lucide-react";
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
        { icon: LayoutDashboard, label: "Dash", path: "/instructor/dashboard" },
        { icon: User, label: "Profile", path: "/profile" },
      ]
    : [
        { icon: Compass, label: "Browse", path: "/browse" },
        { icon: Home, label: "Home", path: "/home" },
        { icon: User, label: "Profile", path: "/profile" },
      ];

  const isNewEventActive = location.pathname === "/instructor/retreats/new" || location.pathname.startsWith("/instructor/retreats/") && location.pathname.includes("/edit");

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {/* Plus button for instructors - centered and prominent */}
        {role === 'instructor' && (
          <button
            onClick={() => navigate("/instructor/retreats/new")}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors relative",
              isNewEventActive ? "text-accent" : "text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center transition-all",
              isNewEventActive 
                ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg" 
                : "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md hover:shadow-lg"
            )}>
              <Plus className="w-6 h-6" />
            </div>
            <span className="text-xs">Add Event</span>
          </button>
        )}
        
        {/* Regular nav items */}
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
