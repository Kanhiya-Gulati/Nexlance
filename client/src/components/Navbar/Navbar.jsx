import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import * as chatService from '../../services/chatService';
import './Navbar.css';

/**
 * Navbar - Professional responsive navigation bar.
 * Shows different navigation links based on user authentication status and role.
 * Features a mobile hamburger menu and fixed positioning with backdrop blur.
 */
const Navbar = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count from conversations on mount and route changes
  useEffect(() => {
    if (!user) return;

    const fetchUnread = async () => {
      try {
        const data = await chatService.getConversations();
        const count = data.conversations?.reduce((sum, c) => sum + (c.unreadCount || 0), 0) || 0;
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch unread message count');
      }
    };
    fetchUnread();
  }, [user, location.pathname]);

  // Listen for receiveMessage event to increment unreadCount in real-time
  useEffect(() => {
    if (!socket || !user) return;

    const handleNewMessage = (msg) => {
      // Only increment count if we are not currently viewing that conversation
      const onCurrentChatPage = location.pathname === `/chat/${msg.conversation}`;
      if (!onCurrentChatPage) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('receiveMessage', handleNewMessage);
    return () => {
      socket.off('receiveMessage', handleNewMessage);
    };
  }, [socket, user, location.pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const closeMenu = () => setMenuOpen(false);

  // Check if a path is active for styling
  const isActive = (path) => location.pathname === path;

  // Determine the dashboard path based on role
  const dashboardPath = user?.role === 'client' ? '/dashboard/client' : '/dashboard/freelancer';

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          NEXLANCE
        </Link>

        {/* Desktop Navigation */}
        <div className={`navbar-menu ${menuOpen ? 'navbar-menu-open' : ''}`}>
          {user ? (
            <>
              {/* Authenticated Links */}
              <Link
                to={dashboardPath}
                className={`navbar-link ${isActive(dashboardPath) ? 'navbar-link-active' : ''}`}
                onClick={closeMenu}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Dashboard
              </Link>

              {/* Client-specific Links */}
              {user.role === 'client' && (
                <Link
                  to="/client/create-job"
                  className={`navbar-link ${isActive('/client/create-job') ? 'navbar-link-active' : ''}`}
                  onClick={closeMenu}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Post Job
                </Link>
              )}

              {/* Freelancer-specific Links */}
              {user.role === 'freelancer' && (
                <>
                  <Link
                    to="/freelancer/browse-jobs"
                    className={`navbar-link ${isActive('/freelancer/browse-jobs') ? 'navbar-link-active' : ''}`}
                    onClick={closeMenu}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Browse Jobs
                  </Link>
                  <Link
                    to="/freelancer/my-applications"
                    className={`navbar-link ${isActive('/freelancer/my-applications') ? 'navbar-link-active' : ''}`}
                    onClick={closeMenu}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    My Applications
                  </Link>
                </>
              )}

              {/* Chat Link */}
              <Link
                to="/chat"
                className={`navbar-link ${isActive('/chat') ? 'navbar-link-active' : ''}`}
                onClick={closeMenu}
                style={{ position: 'relative' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Chat</span>
                {unreadCount > 0 && (
                  <span className="navbar-unread-badge">
                    {unreadCount}
                  </span>
                )}
              </Link>

              {/* Profile & Logout */}
              <div className="navbar-user-section">
                <Link
                  to={`/profile/${user._id}`}
                  className="navbar-profile-link"
                  onClick={closeMenu}
                >
                  <div className="navbar-avatar">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="navbar-avatar-img" />
                    ) : (
                      <span className="navbar-avatar-text">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <span className="navbar-username">{user.name?.split(' ')[0]}</span>
                </Link>
                <button className="navbar-logout-btn" onClick={handleLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span className="logout-text">Logout</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Guest Links */}
              <Link to="/" className={`navbar-link ${isActive('/') ? 'navbar-link-active' : ''}`} onClick={closeMenu}>
                Home
              </Link>
              <div className="navbar-auth-buttons">
                <Link to="/login" className="navbar-btn navbar-btn-secondary" onClick={closeMenu}>
                  Sign In
                </Link>
                <Link to="/register" className="navbar-btn navbar-btn-primary" onClick={closeMenu}>
                  Get Started
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className={`navbar-hamburger ${menuOpen ? 'is-open' : ''}`}
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label="Toggle menu"
        >
          <span className="navbar-hamburger-line"></span>
          <span className="navbar-hamburger-line"></span>
          <span className="navbar-hamburger-line"></span>
        </button>
      </div>

      {/* Mobile Drawer menu */}
      <div className={`navbar-drawer ${menuOpen ? 'is-open' : ''}`}>
        <div className="navbar-drawer-header">
          <span className="navbar-drawer-logo">NEXLANCE</span>
          <button className="navbar-drawer-close" onClick={closeMenu} aria-label="Close menu">
            &times;
          </button>
        </div>

        {user && (
          <div className="navbar-drawer-profile">
            <div className="navbar-drawer-profile-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
              ) : (
                <span>{user.name?.charAt(0)?.toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="navbar-drawer-profile-name">{user.name}</div>
              <div className="navbar-drawer-profile-role" style={{ textTransform: 'capitalize' }}>{user.role}</div>
            </div>
          </div>
        )}

        <div className="navbar-drawer-menu">
          {user ? (
            <>
              <Link to={dashboardPath} className={`navbar-drawer-link ${isActive(dashboardPath) ? 'navbar-drawer-link-active' : ''}`} onClick={closeMenu}>
                Dashboard
              </Link>
              {user.role === 'client' && (
                <Link to="/client/create-job" className={`navbar-drawer-link ${isActive('/client/create-job') ? 'navbar-drawer-link-active' : ''}`} onClick={closeMenu}>
                  Post Job
                </Link>
              )}
              {user.role === 'freelancer' && (
                <>
                  <Link to="/freelancer/browse-jobs" className={`navbar-drawer-link ${isActive('/freelancer/browse-jobs') ? 'navbar-drawer-link-active' : ''}`} onClick={closeMenu}>
                    Browse Jobs
                  </Link>
                  <Link to="/freelancer/my-applications" className={`navbar-drawer-link ${isActive('/freelancer/my-applications') ? 'navbar-drawer-link-active' : ''}`} onClick={closeMenu}>
                    My Applications
                  </Link>
                </>
              )}
              <Link to="/chat" className={`navbar-drawer-link ${isActive('/chat') ? 'navbar-drawer-link-active' : ''}`} onClick={closeMenu} style={{ position: 'relative' }}>
                Chat {unreadCount > 0 && <span className="navbar-unread-badge" style={{ position: 'relative', display: 'inline-flex', top: '0', right: '0', marginLeft: '6px' }}>{unreadCount}</span>}
              </Link>
              <Link to={`/profile/${user._id}`} className={`navbar-drawer-link ${isActive(`/profile/${user._id}`) ? 'navbar-drawer-link-active' : ''}`} onClick={closeMenu}>
                Profile
              </Link>
            </>
          ) : (
            <>
              <Link to="/" className={`navbar-drawer-link ${isActive('/') ? 'navbar-drawer-link-active' : ''}`} onClick={closeMenu}>
                Home
              </Link>
            </>
          )}
        </div>

        <div className="navbar-drawer-footer">
          {user ? (
            <button className="navbar-drawer-logout" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="navbar-drawer-btn navbar-drawer-btn-secondary" onClick={closeMenu}>
                Sign In
              </Link>
              <Link to="/register" className="navbar-drawer-btn navbar-drawer-btn-primary" onClick={closeMenu}>
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      <div className={`navbar-overlay ${menuOpen ? 'is-open' : ''}`} onClick={closeMenu} />
    </nav>
  );
};

export default Navbar;
