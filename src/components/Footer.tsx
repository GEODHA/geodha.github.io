import { PLAY_STORE_URL, IOS_APP_URL } from '@/config/appLinks';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Instagram, MessageSquare } from 'lucide-react';
import logoSvg from '@/assets/LOGO_SVG.svg';
import reapBenefitLogo from '@/assets/reap-benefit-logo.png';

const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="container px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="space-y-4 lg:col-span-1">
            <Link to="/" className="inline-block group">
              <img
                src={logoSvg}
                alt="GEODHA"
                className="h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                loading="lazy"
                decoding="async"
              />
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Civic accountability for Bengaluru's wards. Citizen-generated evidence → institutions act.
            </p>
            <div className="flex gap-2">
              <a
                href="mailto:contact@geodha.org"
                className="p-2 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
              <a
                href="https://www.linkedin.com/company/geodha"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/geodha_org"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="https://www.reddit.com/r/geodha"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-md border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
                aria-label="Reddit"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Partners & Supporters */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Partners &amp; Supporters</h3>
            <div className="flex flex-col gap-4">
              <a
                href="https://www.reapbenefit.org"
                target="_blank"
                rel="noopener noreferrer"
                className="opacity-70 hover:opacity-100 transition-opacity inline-block"
                aria-label="Reap Benefit"
              >
                <img
                  src={reapBenefitLogo}
                  alt="Reap Benefit"
                  className="h-8 w-auto object-contain"
                  loading="lazy"
                  decoding="async"
                />
              </a>
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Platform</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              <li><Link to="/data" className="hover:text-primary transition-colors">Data &amp; Analysis</Link></li>
              <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
              <li><Link to="/report" className="hover:text-primary transition-colors font-medium">Report a Problem</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Resources</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/guide" className="hover:text-primary transition-colors">Waste Segregation Guide</Link></li>
              <li><Link to="/guide2" className="hover:text-primary transition-colors">BWG Disposal Guidelines</Link></li>
              <li><Link to="/volunteer" className="hover:text-primary transition-colors">Volunteer for Cleanups</Link></li>
              <li><Link to="/waste-to-value" className="hover:text-primary transition-colors">Waste to Value Opportunities</Link></li>
            </ul>
          </div>

          {/* About */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">About</h3>
            <ul className="space-y-2.5 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-primary transition-colors">Our Mission</Link></li>
              <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li>
                <a href="mailto:contact@geodha.org" className="hover:text-primary transition-colors">
                  Contact Us
                </a>
              </li>
              <li>
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  Android App — Google Play
                </a>
              </li>
              <li>
                <a href={IOS_APP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  iOS Beta — TestFlight
                </a>
              </li>
            </ul>
          </div>

          {/* Get Involved */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Get Involved</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              See a garbage problem around you? Tell us more about it and learn about existing solutions.
            </p>
            <Link
              to="/report"
              className="inline-block px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-md transition-colors"
            >
              Submit Report →
            </Link>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>© 2026 GEODHA. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
