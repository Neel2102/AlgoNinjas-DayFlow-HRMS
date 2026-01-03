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

  handleLogout = () => {
    if (this.props.onLogout) this.props.onLogout();
    this.setState({ isLoggedIn: false, avatarUrl: "" });
  };

  render() {
    const { isScrolled } = this.state;
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
              <img className="navbar-logoimg-navbar" src="/white.png" alt="Dayflow" />
            </div>
            <span className="navbar-brandname-navbar">Dayflow</span>
          </div>

          {/* Desktop Navigation Links */}
          <div className="navbar-links-navbar" />

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
                <Link className="navbar-btn-login-navbar" to="/dashboard">Open App</Link>
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
        </div>
      </nav>
    );
  }
}

export default NavbarWithAuth;