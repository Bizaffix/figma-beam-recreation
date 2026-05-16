import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, LogOut, User, LayoutDashboard, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Header = () => {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'instructor') return '/instructor/dashboard';
    return '/home';
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/quiltmatch-logo.svg" 
                alt="BookMyQuiltRetreat Logo" 
                className="w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-lg object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
            {user ? (
              <>
                {role === 'student' && (
                  <>
                <Link
                  to="/home"
                  className="text-sm font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                >
                  My Dashboard
                </Link>
                  </>
                )}
                {role === 'instructor' && (
                  <>
                    <Link
                      to="/instructor/browse"
                      className="text-sm font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                    >
                      Browse
                    </Link>
                    <Link
                      to="/instructor/dashboard"
                      className="text-sm font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                    >
                      Dashboard
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="text-sm font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                >
                  Profile
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9">
                      <User className="w-4 h-4 mr-2" />
                      Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => navigate(getDashboardLink())}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link
                  to="/find"
                  className="text-sm font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                >
                  Find with AI
                </Link>
                <Link
                  to="/how-it-works"
                  className="text-sm font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                >
                  How It Works
                </Link>
              </>
            )}
          </nav>

          {/* Auth Buttons - Always Visible */}
          {!user && (
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" size="sm" className="text-[#387C7F] hover:text-[#459394] hover:bg-[#459394]/10">
                <Link to="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="bg-[#459394] hover:bg-[#387C7F] text-white">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="h-10 w-10 rounded-lg hover:bg-muted"
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5 text-foreground" />
                ) : (
                  <Menu className="h-5 w-5 text-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-sm bg-background z-50 md:hidden shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <Link 
                  to="/" 
                  className="flex items-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <img 
                    src="/quiltmatch-logo.svg" 
                    alt="BookMyQuiltRetreat Logo" 
                    className="w-32 h-32 rounded-lg object-contain"
                  />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                  className="h-10 w-10 rounded-lg hover:bg-muted"
                >
                  <X className="h-5 w-5 text-foreground" />
                </Button>
              </div>

              {/* Mobile Menu Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {user ? (
                  <>
                    {role === 'student' && (
                      <>
                        <Link
                          to="/home"
                          className="block py-3 text-base font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          My Dashboard
                        </Link>
                      </>
                    )}
                    {role === 'instructor' && (
                      <>
                        <Link
                          to="/instructor/browse"
                          className="block py-3 text-base font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Browse
                        </Link>
                        <Link
                          to="/instructor/dashboard"
                          className="block py-3 text-base font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                      </>
                    )}
                    <Link
                      to="/profile"
                      className="block py-3 text-base font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <div className="pt-4 border-t">
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-base h-12"
                        onClick={() => {
                          handleLogout();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <LogOut className="w-5 h-5 mr-2" />
                        Log Out
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1">
                      <Link
                        to="/find"
                        className="block py-3 text-base font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Find with AI
                        </span>
                      </Link>
                      <Link
                        to="/how-it-works"
                        className="block py-3 text-base font-medium text-[#387C7F] hover:text-[#459394] transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        How It Works
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

