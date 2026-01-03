import React, { Component } from 'react';
import { Link } from "react-router-dom";
import '../CSS/Navbar.css';

import { useAuth } from "../context/AuthContext";

const NavbarWithAuth = () => {
  const { isAuthenticated, user, signOut } = useAuth();

  return (
    <Navbar
      isAuthenticated={isAuthenticated}
      user={user}
      onLogout={signOut}
    />
  );
};

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false,
      isScrolled: false,
      isLoggedIn: false, 
      avatarUrl: "",
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
    window.addEventListener('profile_picture_updated', this.syncAvatar);
    window.addEventListener('storage', this.onStorage);
    this.syncAvatar();
  }

  componentDidUpdate(prevProps) {
    const prevKey = this.getAvatarKey(prevProps.user);
    const nextKey = this.getAvatarKey(this.props.user);
    if (prevKey !== nextKey) {
      this.syncAvatar();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('profile_picture_updated', this.syncAvatar);
    window.removeEventListener('storage', this.onStorage);
  }

  onStorage = (e) => {
    const key = this.getAvatarKey(this.props.user);
    if (e && e.key && e.key !== key) return;
    this.syncAvatar();
  };

  getAvatarKey = (u) => {
    const id = u?.id || u?._id || u?.user?.id || u?.user?._id || "";
    const email = u?.email || u?.user?.email || "";
    const k = String(id || email || "").trim();
    return k ? `profile_picture_url:${k}` : "profile_picture_url";
  };

  syncAvatar = () => {
    const isLoggedIn = Boolean(this.props.isAuthenticated) || this.state.isLoggedIn;
    if (!isLoggedIn) {
      this.setState({ avatarUrl: "" });
      return;
    }
    const url = localStorage.getItem(this.getAvatarKey(this.props.user)) || "";
    this.setState({ avatarUrl: url });
  };

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

  handleLogout = () => {
    if (this.props.onLogout) this.props.onLogout();
    this.setState({ isLoggedIn: false, avatarUrl: "" });
  };

  render() {
    const { isMenuOpen, isScrolled } = this.state;
    const isLoggedIn = Boolean(this.props.isAuthenticated) || this.state.isLoggedIn;
    const username = this.props.user?.email || "";
    const avatarUrl = this.state.avatarUrl || "";
    const avatarFallback = (username || "U").slice(0, 1).toUpperCase();

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
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="profile" />
                  ) : (
                    <span>{avatarFallback}</span>
                  )}
                </div>
                <span className="navbar-username-navbar">{username || "User"}</span>
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
                <Link className="navbar-btn-login-navbar" to="/signin">Login</Link>
                <Link className="navbar-btn-signup-navbar" to="/signup">Sign Up</Link>
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
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="profile" />
                    ) : (
                      <span>{avatarFallback}</span>
                    )}
                  </div>
                  <span className="navbar-mobile-username-navbar">{username || "User"}</span>
                </div>
                <button className="navbar-mobile-logout-navbar" onClick={this.handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link className="navbar-mobile-btn-login-navbar" to="/signin" onClick={this.closeMenu}>Login</Link>
                <Link className="navbar-mobile-btn-signup-navbar" to="/signup" onClick={this.closeMenu}>Sign Up</Link>
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

export default NavbarWithAuth;