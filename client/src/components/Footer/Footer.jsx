import { Link } from 'react-router-dom';
import './Footer.css';

/**
 * Footer - Global app footer with branding, social media links,
 * and resource directories designed in Fiverr/Upwork aesthetic.
 */
const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {/* Upper Main Footer Grid */}
      <div className="footer-main">
        <div className="container footer-grid">
          {/* Brand Column */}
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              NEXLANCE<span className="navbar-logo-dot">.</span>
            </Link>
            <p className="footer-tagline">
              Connecting premium clients with world-class freelancers. Start hiring, working, and growing today on the world's most trusted marketplace.
            </p>
            <div className="footer-social">
              <a href="#" className="footer-social-link" aria-label="Twitter">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
                </svg>
              </a>
              <a href="#" className="footer-social-link" aria-label="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                  <rect x="2" y="9" width="4" height="12" />
                  <circle cx="4" cy="4" r="2" />
                </svg>
              </a>
              <a href="#" className="footer-social-link" aria-label="GitHub">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories / Platform */}
          <div className="footer-column">
            <h4 className="footer-column-title">For Clients</h4>
            <ul className="footer-links">
              <li><Link to="/client/create-job" className="footer-link">Post a Project</Link></li>
              <li><Link to="/login" className="footer-link">Search Talents</Link></li>
              <li><Link to="/register" className="footer-link">Client Registration</Link></li>
              <li><a href="#" className="footer-link">Enterprise Solutions</a></li>
            </ul>
          </div>

          {/* For Freelancers */}
          <div className="footer-column">
            <h4 className="footer-column-title">For Freelancers</h4>
            <ul className="footer-links">
              <li><Link to="/freelancer/browse-jobs" className="footer-link">Find Work</Link></li>
              <li><Link to="/freelancer/my-applications" className="footer-link">My Proposals</Link></li>
              <li><Link to="/freelancer/saved-jobs" className="footer-link">Saved Projects</Link></li>
              <li><a href="#" className="footer-link">Freelancer Success</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="footer-column">
            <h4 className="footer-column-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">About Us</a></li>
              <li><a href="#" className="footer-link">Careers</a></li>
              <li><a href="#" className="footer-link">Press & News</a></li>
              <li><a href="#" className="footer-link">Trust & Safety</a></li>
            </ul>
          </div>

          {/* Support */}
          <div className="footer-column">
            <h4 className="footer-column-title">Support</h4>
            <ul className="footer-links">
              <li><a href="#" className="footer-link">Help & Support</a></li>
              <li><a href="#" className="footer-link">Community Forum</a></li>
              <li><a href="#" className="footer-link">Terms of Service</a></li>
              <li><a href="#" className="footer-link">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* Lower Copyright Bar */}
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p className="footer-copyright">
            &copy; {year} Nexlance International Ltd. All rights reserved.
          </p>
          <div className="footer-bottom-links">
            <a href="#" className="footer-bottom-link">Terms of Service</a>
            <span className="footer-bottom-separator">|</span>
            <a href="#" className="footer-bottom-link">Privacy Policy</a>
            <span className="footer-bottom-separator">|</span>
            <a href="#" className="footer-bottom-link">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
