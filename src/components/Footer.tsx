import { Link } from "react-router-dom";
import { Mail, MessageSquare, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Company Info */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center">
              <img 
                src="/Final quilt logo-01.png" 
                alt="BookMyQuiltRetreat Logo" 
                className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-lg object-contain"
              />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Connecting passionate quilters with inspiring retreats and workshops. Your next quilting adventure starts here.
            </p>
            <div className="flex space-x-3 sm:space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube"
              >
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">Quick Links</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/#how-it-works"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  How It Works
                </Link>
              </li>
              <li>
                <Link
                  to="/signup?role=student"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Find a Retreat
                </Link>
              </li>
              <li>
                <Link
                  to="/signup?role=instructor"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  List Your Retreat
                </Link>
              </li>
              <li>
                <Link
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* For Users */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">For Users</h3>
            <ul className="space-y-1.5 sm:space-y-2">
              <li>
                <Link
                  to="/signup?role=student"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Create Quilter Account
                </Link>
              </li>
              <li>
                <Link
                  to="/signup?role=instructor"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Become an Instructor
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Browse Retreats
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Help Center
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-sm sm:text-base text-foreground">Contact Us</h3>
            <ul className="space-y-2 sm:space-y-3">
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <a
                  href="mailto:notifications@bookmyquiltretreat.com"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  notifications@bookmyquiltretreat.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MessageSquare className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <a
                  href="tel:+18018212328"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Text: (801) 821-2328
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
            © {currentYear} BookMyQuiltRetreat.com. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center md:justify-end gap-4 sm:gap-6 text-xs sm:text-sm">
            <Link
              to="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="#"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

