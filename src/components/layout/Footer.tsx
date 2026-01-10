import { Link } from 'react-router-dom';
import { Sprout, Facebook, Twitter, Linkedin, MessageCircle } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-foreground text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">Our Future Chama</span>
            </div>
            <p className="text-primary-foreground/70 leading-relaxed">
              Digitizing Kenyan savings groups for collective prosperity and financial inclusion.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <a href="/#features" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="/#how-it-works" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <Link to="/about" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/terms" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="text-primary-foreground/70 hover:text-secondary transition-colors">
                  Compliance
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3 text-primary-foreground/70">
              <li className="flex items-start gap-2">
                <span>📍</span>
                <span>Nairobi, Kenya</span>
              </li>
              <li className="flex items-start gap-2">
                <span>📞</span>
                <a href="tel:+254711123456" className="hover:text-secondary transition-colors">
                  +254 711 123 456
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span>✉️</span>
                <a href="mailto:support@ourfuturechama.co.ke" className="hover:text-secondary transition-colors">
                  support@ourfuturechama.co.ke
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20 text-center text-primary-foreground/60">
          <p>© 2024 Our Future Chama. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
