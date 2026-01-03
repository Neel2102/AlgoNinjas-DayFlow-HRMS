import React from 'react';
import { useNavigate } from "react-router-dom";
import '../CSS/Landingpage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="container-landingpage">
      {/* Hero Section */}
      <section className="hero-landingpage">
        <div className="hero-overlay-landingpage"></div>
        <div className="hero-content-landingpage">
          <div className="hero-text-landingpage">
            <h1 className="hero-title-landingpage">
              Streamline Your Workforce with <span className="brand-landingpage">Dayflow</span>
            </h1>
            <p className="hero-subtitle-landingpage">
              The modern HRMS solution that transforms how you manage people, payroll, and performance. 
              Built for teams that value efficiency and growth.
            </p>
            <div className="hero-buttons-landingpage">
              <button className="btn-primary-landingpage" onClick={() => navigate("/signin")}>Get start</button>
              {/* <button className="btn-secondary-landingpage">Watch Demo</button> */}
            </div>
            <div className="hero-stats-landingpage">
              <div className="stat-item-landingpage">
                <span className="stat-number-landingpage">10K+</span>
                <span className="stat-label-landingpage">Companies</span>
              </div>
              <div className="stat-item-landingpage">
                <span className="stat-number-landingpage">500K+</span>
                <span className="stat-label-landingpage">Employees</span>
              </div>
              <div className="stat-item-landingpage">
                <span className="stat-number-landingpage">99.9%</span>
                <span className="stat-label-landingpage">Uptime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-landingpage">
        <div className="section-header-landingpage">
          <h2 className="section-title-landingpage">Everything You Need in One Place</h2>
          <p className="section-subtitle-landingpage">
            Powerful features designed to simplify HR management and empower your team
          </p>
        </div>
        
        <div className="features-grid-landingpage">
          <div className="feature-card-landingpage">
            <div className="feature-icon-landingpage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h3 className="feature-title-landingpage">Employee Management</h3>
            <p className="feature-desc-landingpage">
              Centralize employee data, track records, and manage your entire workforce from one intuitive dashboard.
            </p>
          </div>

          <div className="feature-card-landingpage">
            <div className="feature-icon-landingpage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <h3 className="feature-title-landingpage">Attendance Tracking</h3>
            <p className="feature-desc-landingpage">
              Real-time attendance monitoring with biometric integration, GPS tracking, and automated reports.
            </p>
          </div>

          <div className="feature-card-landingpage">
            <div className="feature-icon-landingpage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h3 className="feature-title-landingpage">Leave Management</h3>
            <p className="feature-desc-landingpage">
              Streamline leave requests, approvals, and balance tracking with customizable policies and workflows.
            </p>
          </div>

          <div className="feature-card-landingpage">
            <div className="feature-icon-landingpage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <h3 className="feature-title-landingpage">Payroll Processing</h3>
            <p className="feature-desc-landingpage">
              Automated salary calculations, tax deductions, and seamless payment processing every single time.
            </p>
          </div>

          <div className="feature-card-landingpage">
            <div className="feature-icon-landingpage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <h3 className="feature-title-landingpage">Performance Analytics</h3>
            <p className="feature-desc-landingpage">
              Track KPIs, monitor productivity, and gain actionable insights with comprehensive analytics dashboards.
            </p>
          </div>

          <div className="feature-card-landingpage">
            <div className="feature-icon-landingpage">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h3 className="feature-title-landingpage">Security & Compliance</h3>
            <p className="feature-desc-landingpage">
              Enterprise-grade security with role-based access, data encryption, and full regulatory compliance.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-landingpage">
        <div className="benefits-content-landingpage">
          <div className="benefits-left-landingpage">
            <h2 className="benefits-title-landingpage">Why Choose Dayflow?</h2>
            <div className="benefits-list-landingpage">
              <div className="benefit-item-landingpage">
                <div className="benefit-icon-landingpage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="benefit-text-landingpage">
                  <h4>Intuitive Interface</h4>
                  <p>User-friendly design that requires minimal training and maximizes adoption</p>
                </div>
              </div>

              <div className="benefit-item-landingpage">
                <div className="benefit-icon-landingpage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="benefit-text-landingpage">
                  <h4>Cloud-Based Access</h4>
                  <p>Access your HRMS anytime, anywhere, from any device with internet</p>
                </div>
              </div>

              <div className="benefit-item-landingpage">
                <div className="benefit-icon-landingpage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="benefit-text-landingpage">
                  <h4>24/7 Support</h4>
                  <p>Round-the-clock customer support to help you whenever you need it</p>
                </div>
              </div>

              <div className="benefit-item-landingpage">
                <div className="benefit-icon-landingpage">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
                <div className="benefit-text-landingpage">
                  <h4>Scalable Solution</h4>
                  <p>Grows with your business from startup to enterprise level</p>
                </div>
              </div>
            </div>
          </div>

          <div className="benefits-right-landingpage">
            <div className="benefits-card-landingpage">
              <div className="benefits-card-icon-landingpage">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
              </div>
              <h3>Lightning Fast</h3>
              <p>Optimized performance for quick load times and seamless user experience</p>
            </div>

            <div className="benefits-card-landingpage">
              <div className="benefits-card-icon-landingpage">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
              <h3>Bank-Level Security</h3>
              <p>Your data is protected with AES-256 encryption and regular security audits</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="cta-landingpage">
        <div className="cta-content-landingpage">
          <h2 className="cta-title-landingpage">Ready to Transform Your HR Operations?</h2>
          <p className="cta-subtitle-landingpage">
            Join thousands of companies already using Dayflow to streamline their workforce management
          </p>
          <div className="cta-buttons-landingpage">
            <button className="btn-cta-primary-landingpage">Get Started Free</button>
            <button className="btn-cta-secondary-landingpage">Schedule Demo</button>
          </div>
          <p className="cta-note-landingpage">No credit card required • 14-day free trial • Cancel anytime</p>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="footer-landingpage">
        <div className="footer-content-landingpage">
          <div className="footer-brand-landingpage">
            <h3>Dayflow</h3>
            <p>Modern HRMS for modern teams</p>
          </div>
          <div className="footer-links-landingpage">
            <div className="footer-column-landingpage">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#integrations">Integrations</a>
            </div>
            <div className="footer-column-landingpage">
              <h4>Company</h4>
              <a href="#about">About Us</a>
              <a href="#careers">Careers</a>
              <a href="#contact">Contact</a>
            </div>
            <div className="footer-column-landingpage">
              <h4>Resources</h4>
              <a href="#docs">Documentation</a>
              <a href="#blog">Blog</a>
              <a href="#support">Support</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-landingpage">
          <p>&copy; 2026 Dayflow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;