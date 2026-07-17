import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Home.css';

const categories = [
  { icon: '💻', name: 'Web Development', description: 'Custom websites, web apps, and e-commerce solutions' },
  { icon: '📱', name: 'Mobile Development', description: 'iOS and Android apps built with modern frameworks' },
  { icon: '🎨', name: 'UI/UX Design', description: 'Beautiful interfaces and seamless user experiences' },
  { icon: '✏️', name: 'Graphic Design', description: 'Logos, branding, illustrations, and visual content' },
  { icon: '📝', name: 'Content Writing', description: 'Blog posts, copywriting, and technical documentation' },
  { icon: '📈', name: 'Digital Marketing', description: 'SEO, social media, PPC, and growth strategies' },
  { icon: '📊', name: 'Data Science', description: 'Analytics, machine learning, and data visualization' },
  { icon: '🎬', name: 'Video Editing', description: 'Professional video production and post-processing' },
];

const steps = [
  { number: '01', icon: '📋', title: 'Post a Job', description: 'Describe your project requirements, set your budget, and publish it to our marketplace.' },
  { number: '02', icon: '📬', title: 'Get Applications', description: 'Review proposals from skilled freelancers, compare portfolios, and shortlist candidates.' },
  { number: '03', icon: '🤝', title: 'Hire & Collaborate', description: 'Work together seamlessly, track progress, and achieve outstanding results.' },
];

const stats = [
  { value: '10K+', label: 'Freelancers' },
  { value: '5K+', label: 'Projects Completed' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '50+', label: 'Categories' },
];

const Home = () => {
  const { user } = useAuth();

  const hireLink = user ? (user.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer') : '/register';
  const workLink = user ? (user.role === 'freelancer' ? '/dashboard/freelancer' : '/dashboard/client') : '/register';

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-bg-shapes">
          <div className="hero-shape hero-shape-1"></div>
          <div className="hero-shape hero-shape-2"></div>
          <div className="hero-shape hero-shape-3"></div>
          <div className="hero-shape hero-shape-4"></div>
          <div className="hero-shape hero-shape-5"></div>
          <div className="hero-glow"></div>
        </div>
        <div className="hero-content container">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            The #1 Freelance Marketplace
          </div>
          <h1 className="hero-title">
            Find the Perfect <br />
            <span className="gradient-text">Freelancer</span> for <br />
            Your Project
          </h1>
          <p className="hero-subtitle">
            Connect with top talent and bring your ideas to life on NEXLANCE.
            Trusted by thousands of businesses worldwide.
          </p>
          <div className="hero-cta-group">
            <Link to={hireLink} className="btn-hero-primary">
              <span>Hire a Freelancer</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link to={workLink} className="btn-hero-outline">
              <span>Find Work</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="stats-bar">
          <div className="stats-bar-inner container">
            {stats.map((stat, index) => (
              <div className="stat-item" key={index}>
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Banner */}
      <section className="trusted-by-section">
        <div className="container">
          <span className="trusted-by-title">Trusted by leading brands:</span>
          <div className="trusted-brands-grid">
            <span className="brand-logo">Google</span>
            <span className="brand-logo">Microsoft</span>
            <span className="brand-logo">Meta</span>
            <span className="brand-logo">Netflix</span>
            <span className="brand-logo">Amazon</span>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section container fade-in">
        <div className="section-header">
          <span className="section-tag">Explore</span>
          <h2 className="section-title">Popular Categories</h2>
          <p className="section-subtitle">
            Browse through our most popular service categories and find the right expert for your needs.
          </p>
        </div>
        <div className="categories-grid">
          {categories.map((cat, index) => (
            <div className="category-card" key={index} style={{ animationDelay: `${index * 0.08}s` }}>
              <div className="category-icon">{cat.icon}</div>
              <h3 className="category-name">{cat.name}</h3>
              <p className="category-description">{cat.description}</p>
              <div className="category-arrow">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Nexlance Section (Value Proposition) */}
      <section className="features-section container fade-in">
        <div className="features-grid">
          <div className="features-content">
            <span className="section-tag">Value Proposition</span>
            <h2 className="section-title" style={{ textAlign: 'left' }}>A whole world of freelance talent at your fingertips</h2>
            
            <div className="feature-item">
              <div className="feature-icon-wrapper">🛡️</div>
              <div className="feature-text">
                <h3>Proof of quality</h3>
                <p>Check any freelancer's work history, client reviews, and portfolio before you hire.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">⚡</div>
              <div className="feature-text">
                <h3>Fast hiring</h3>
                <p>Receive competitive proposals within minutes and start working on your project immediately.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">🔒</div>
              <div className="feature-text">
                <h3>Safe & Secure Payments</h3>
                <p>Only release payments to the freelancer once you approve the completed project milestone.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-wrapper">🤝</div>
              <div className="feature-text">
                <h3>Dedicated Support</h3>
                <p>Our support team is here 24/7 to help resolve disputes and keep your projects running smoothly.</p>
              </div>
            </div>
          </div>
          
          <div className="features-visual">
            <div className="visual-card visual-card-1">
              <div className="visual-badge">Active Job</div>
              <h4>Next.js E-Commerce Frontend Rebuild</h4>
              <p>Budget: $1,200 — 14 Applicants</p>
              <div className="visual-progress-bar">
                <div className="visual-progress-fill" style={{ width: '70%' }}></div>
              </div>
            </div>
            <div className="visual-card visual-card-2">
              <div className="visual-avatar-row">
                <div className="visual-avatar" style={{ background: '#1dbf73' }}>DK</div>
                <div>
                  <h5>Deepanshu K.</h5>
                  <p>Web Development Expert</p>
                </div>
              </div>
              <div className="visual-stars">⭐⭐⭐⭐⭐</div>
              <p className="visual-quote">"Delivered the Nexlance platform on time with outstanding quality!"</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Simple Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Get started in just three simple steps and find your perfect match.
            </p>
          </div>
          <div className="steps-container">
            <div className="steps-connector"></div>
            {steps.map((step, index) => (
              <div className="step-card" key={index} style={{ animationDelay: `${index * 0.15}s` }}>
                <div className="step-number-wrapper">
                  <span className="step-number">{step.number}</span>
                </div>
                <div className="step-icon">{step.icon}</div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-description">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Guides Section */}
      <section className="guides-section container fade-in">
        <div className="guides-grid">
          <div className="guide-card guide-card-client">
            <span className="guide-tag">For Clients</span>
            <h3>Find talent your way</h3>
            <p>Work with top rated freelancers, post a job, or browse our service categories to hire.</p>
            <Link to={hireLink} className="guide-link">
              Post a Job & Hire ➔
            </Link>
          </div>
          <div className="guide-card guide-card-freelancer">
            <span className="guide-tag">For Freelancers</span>
            <h3>Find work your way</h3>
            <p>Grow your business, find new opportunities, and work flexibly with global clients.</p>
            <Link to={workLink} className="guide-link">
              Find Opportunities ➔
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section fade-in">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">Reviews</span>
            <h2 className="section-title">What Our Users Say</h2>
            <p className="section-subtitle">Read success stories from businesses and independent experts on Nexlance.</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar" style={{ background: '#e3f2fd', color: '#1565c0' }}>JD</div>
                <div>
                  <h4>John Doe</h4>
                  <p>CTO, TechStart Inc.</p>
                </div>
              </div>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"Nexlance made it incredibly easy to find a skilled Next.js developer. We finished our project 2 weeks ahead of schedule!"</p>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar" style={{ background: '#e8f5e9', color: '#2e7d32' }}>AS</div>
                <div>
                  <h4>Ananya Sharma</h4>
                  <p>Freelance UI/UX Designer</p>
                </div>
              </div>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"I've worked on multiple platforms, but Nexlance has the best payment protection. Highly recommended for freelancers."</p>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-header">
                <div className="testimonial-avatar" style={{ background: '#fff3e0', color: '#e65100' }}>MK</div>
                <div>
                  <h4>Michael K.</h4>
                  <p>Founder, Creative Agency</p>
                </div>
              </div>
              <div className="testimonial-rating">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">"The option to chat and share files directly on the page makes collaboration incredibly fast. Exceptional experience!"</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section container fade-in">
        <div className="section-header">
          <span className="section-tag">Help Center</span>
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">Got questions? We've got answers.</p>
        </div>
        <div className="faq-grid">
          <div className="faq-item">
            <h3>How do I hire a freelancer?</h3>
            <p>Simply post a job with details, requirements, and budget. Freelancers will submit proposals, and you can pick the best match after reviewing their profiles and portfolios.</p>
          </div>
          <div className="faq-item">
            <h3>How does payment protection work?</h3>
            <p>Clients fund the project budget which is held securely. Once the freelancer completes the project and the client approves the work, the funds are released. This keeps both parties safe.</p>
          </div>
          <div className="faq-item">
            <h3>Is Nexlance free to join?</h3>
            <p>Yes, creating an account, posting jobs, and browsing jobs on Nexlance is completely free. We only charge a small platform service fee on successful transactions.</p>
          </div>
          <div className="faq-item">
            <h3>How do I communicate with freelancers?</h3>
            <p>Nexlance includes a built-in real-time chat with file attachments (PDFs, images, zip files) and clickable links, making it easy to collaborate directly on the platform.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-bg-shapes">
          <div className="cta-shape cta-shape-1"></div>
          <div className="cta-shape cta-shape-2"></div>
        </div>
        <div className="cta-content container">
          <h2 className="cta-title">Ready to Get Started?</h2>
          <p className="cta-subtitle">
            Join thousands of professionals on NEXLANCE and start building something amazing today.
          </p>
          {!user ? (
            <Link to="/register" className="btn-cta-signup">
              Create Free Account
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <Link to={user.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer'} className="btn-cta-signup">
              Go to Dashboard
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
