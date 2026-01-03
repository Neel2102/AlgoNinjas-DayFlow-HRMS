import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import '../CSS/Employeedashboard.css';

// Custom SVG Icons for header
const Icons = {
  Bell: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
  ),
  Search: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8"></circle>
      <path d="m21 21-4.35-4.35"></path>
    </svg>
  ),
  Menu: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  ),
  Clock: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  ),
  TrendingUp: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
      <polyline points="17 6 23 6 23 12"></polyline>
    </svg>
  ),
  CheckSquare: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  ),
  Users: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
};

const EmployeeDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');

  const stats = [
    { title: 'Total Employees', value: '248', change: '+12%', icon: 'Users' },
    { title: 'Active Projects', value: '32', change: '+5%', icon: 'TrendingUp' },
    { title: 'Pending Tasks', value: '18', change: '-8%', icon: 'CheckSquare' },
    { title: 'Hours Logged', value: '1,842', change: '+15%', icon: 'Clock' },
  ];

  const recentActivities = [
    { user: 'John Doe', action: 'completed task', item: 'Q4 Report', time: '2 hours ago' },
    { user: 'Sarah Smith', action: 'joined project', item: 'Website Redesign', time: '4 hours ago' },
    { user: 'Mike Johnson', action: 'submitted', item: 'Leave Request', time: '5 hours ago' },
    { user: 'Emily Brown', action: 'updated', item: 'Client Proposal', time: '1 day ago' },
  ];

  const upcomingEvents = [
    { title: 'Team Meeting', time: 'Today, 2:00 PM', type: 'meeting' },
    { title: 'Project Deadline', time: 'Tomorrow, 5:00 PM', type: 'deadline' },
    { title: 'Performance Review', time: 'Friday, 10:00 AM', type: 'review' },
  ];

  const renderIcon = (iconName) => {
    const IconComponent = Icons[iconName];
    return IconComponent ? <IconComponent /> : null;
  };

  return (
    <div className="dashboard-container">
      {/* Sidebar Component */}
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      {/* Main Content */}
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            {renderIcon('Menu')}
          </button>
          
          <div className="search-bar">
            {renderIcon('Search')}
            <input type="text" placeholder="Search..." />
          </div>

          <div className="header-actions">
            <button className="icon-btn">
              {renderIcon('Bell')}
              <span className="notification-badge">3</span>
            </button>
            <div className="user-profile">
              <div className="avatar">AD</div>
              <span className="user-name">Admin User</span>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="content">
          <div className="content-header">
            <h1>Dashboard Overview</h1>
            <p className="subtitle">Welcome back! Here's what's happening today.</p>
          </div>

          {/* Stats Grid */}
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  {renderIcon(stat.icon)}
                </div>
                <div className="stat-info">
                  <p className="stat-label">{stat.title}</p>
                  <h3 className="stat-value">{stat.value}</h3>
                  <span className="stat-change">{stat.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Content Grid */}
          <div className="content-grid">
            {/* Recent Activities */}
            <div className="card">
              <div className="card-header">
                <h3>Recent Activities</h3>
              </div>
              <div className="activity-list">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-avatar">{activity.user.charAt(0)}</div>
                    <div className="activity-details">
                      <p>
                        <strong>{activity.user}</strong> {activity.action} <em>{activity.item}</em>
                      </p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="card">
              <div className="card-header">
                <h3>Upcoming Events</h3>
              </div>
              <div className="events-list">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="event-item">
                    <div className={`event-indicator ${event.type}`}></div>
                    <div className="event-details">
                      <h4>{event.title}</h4>
                      <p>{event.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3>Quick Actions</h3>
            </div>
            <div className="quick-actions">
              <button className="action-btn">Add Employee</button>
              <button className="action-btn">Create Task</button>
              <button className="action-btn">Schedule Meeting</button>
              <button className="action-btn">Generate Report</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;