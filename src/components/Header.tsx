import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Menu, X, LogOut, User, LayoutDashboard, Compass, Home, ChevronDown } from "lucide-react";
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
  const location = useLocation();
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

  const handleHowItWorksClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Navigate to landing page, then scroll
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById('how-it-works');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
    
    setMobileMenuOpen(false);
  };

  const handleHomeClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Navigate to landing page
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <img 
                src="/Final quilt logo-01.png" 
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
                      to="/browse"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Browse Events
                    </Link>
                    <Link
                      to="/home"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      My Dashboard
                    </Link>
                  </>
                )}
                {role === 'instructor' && (
                  <>
                    <Link
                      to="/instructor/browse"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Browse
                    </Link>
                    <Link
                      to="/instructor/dashboard"
                      className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dashboard
                    </Link>
                  </>
                )}
                <Link
                  to="/profile"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
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
                  to="/browse"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Retreats
                </Link>
                <a
                  href="/#how-it-works"
                  onClick={handleHowItWorksClick}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  How It Works
                </a>
              </>
            )}
          </nav>

          {/* Auth Buttons - Always Visible */}
          {!user && (
            <div className="flex items-center space-x-3">
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Sign In</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="flex items-center">
                    Sign Up
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/signup?role=student')}>
                    As Attendee
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/signup?role=instructor')}>
                    As Organizer
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/signup?role=location_owner')}>
                    As Venue
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    src="/Final quilt logo-01.png" 
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
                          to="/browse"
                          className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Browse Retreats
                        </Link>
                        <Link
                          to="/home"
                          className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
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
                          className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Browse
                        </Link>
                        <Link
                          to="/instructor/dashboard"
                          className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                      </>
                    )}
                    <Link
                      to="/profile"
                      className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
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
                        to="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
                      >
                        Browse Retreats
                      </Link>
                      <a
                        href="/#how-it-works"
                        onClick={handleHowItWorksClick}
                        className="block py-3 text-base font-medium text-foreground hover:text-primary transition-colors"
                      >
                        How It Works
                      </a>
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

