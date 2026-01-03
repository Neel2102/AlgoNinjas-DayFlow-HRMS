import React, { Component } from 'react';
import '../CSS/Navbar.css';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false,
      isScrolled: false,
      isLoggedIn: false // Change this to true to see logged-in state
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    if (window.scrollY > 50) {
      this.setState({ isScrolled: true });
    } else {
      this.setState({ isScrolled: false });
    }
  };

  toggleMenu = () => {
    this.setState(prevState => ({
      isMenuOpen: !prevState.isMenuOpen
    }));
  };

  closeMenu = () => {
    this.setState({ isMenuOpen: false });
  };

  handleLogin = () => {
    // Handle login logic
    console.log('Login clicked');
  };

  handleSignup = () => {
    // Handle signup logic
    console.log('Signup clicked');
  };

  handleLogout = () => {
    // Handle logout logic
    this.setState({ isLoggedIn: false });
  };

  render() {
    const { isMenuOpen, isScrolled, isLoggedIn } = this.state;

    return (
      <nav className={`navbar-container-navbar ${isScrolled ? 'scrolled-navbar' : ''}`}>
        <div className="navbar-content-navbar">
          {/* Logo and Brand */}
          <div className="navbar-brand-navbar">
            <div className="navbar-logo-navbar">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="48" height="48" rx="10" fill="currentColor"/>
                <path d="M14 18C14 16.8954 14.8954 16 16 16H20C21.1046 16 22 16.8954 22 18V30C22 31.1046 21.1046 32 20 32H16C14.8954 32 14 31.1046 14 30V18Z" fill="white"/>
                <path d="M26 22C26 20.8954 26.8954 20 28 20H32C33.1046 20 34 20.8954 34 22V30C34 31.1046 33.1046 32 32 32H28C26.8954 32 26 31.1046 26 30V22Z" fill="white"/>
                <circle cx="18" cy="12" r="2" fill="white"/>
                <circle cx="30" cy="12" r="2" fill="white"/>
              </svg>
            </div>
            <span className="navbar-brandname-navbar">Dayflow</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="navbar-links-navbar">
            <a href="#features" className="navbar-link-navbar">Features</a>
            <a href="#solutions" className="navbar-link-navbar">Solutions</a>
            <a href="#pricing" className="navbar-link-navbar">Pricing</a>
            <a href="#resources" className="navbar-link-navbar">Resources</a>
            <a href="#about" className="navbar-link-navbar">About</a>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="navbar-auth-navbar">
            {isLoggedIn ? (
              <div className="navbar-profile-navbar">
                <div className="navbar-avatar-navbar">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </div>
                <span className="navbar-username-navbar">John Doe</span>
                <button className="navbar-logout-navbar" onClick={this.handleLogout}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <button className="navbar-btn-login-navbar" onClick={this.handleLogin}>
                  Login
                </button>
                <button className="navbar-btn-signup-navbar" onClick={this.handleSignup}>
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`navbar-hamburger-navbar ${isMenuOpen ? 'active-navbar' : ''}`}
            onClick={this.toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`navbar-mobile-menu-navbar ${isMenuOpen ? 'open-navbar' : ''}`}>
          <div className="navbar-mobile-links-navbar">
            <a href="#features" className="navbar-mobile-link-navbar" onClick={this.closeMenu}>
              Features
            </a>
            <a href="#solutions" className="navbar-mobile-link-navbar" onClick={this.closeMenu}>
              Solutions
            </a>
            <a href="#pricing" className="navbar-mobile-link-navbar" onClick={this.closeMenu}>
              Pricing
            </a>
            <a href="#resources" className="navbar-mobile-link-navbar" onClick={this.closeMenu}>
              Resources
            </a>
            <a href="#about" className="navbar-mobile-link-navbar" onClick={this.closeMenu}>
              About
            </a>
          </div>

          <div className="navbar-mobile-auth-navbar">
            {isLoggedIn ? (
              <>
                <div className="navbar-mobile-profile-navbar">
                  <div className="navbar-mobile-avatar-navbar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <span className="navbar-mobile-username-navbar">John Doe</span>
                </div>
                <button className="navbar-mobile-logout-navbar" onClick={this.handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <button className="navbar-mobile-btn-login-navbar" onClick={this.handleLogin}>
                  Login
                </button>
                <button className="navbar-mobile-btn-signup-navbar" onClick={this.handleSignup}>
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* Overlay */}
        {isMenuOpen && (
          <div className="navbar-overlay-navbar" onClick={this.closeMenu}></div>
        )}
      </nav>
    );
  }
}

export default Navbar;