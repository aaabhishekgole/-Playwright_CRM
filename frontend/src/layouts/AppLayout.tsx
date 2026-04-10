import { useMemo } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { findMenuByPath, getVisibleMenuHierarchy } from '../utils/menuHierarchy';

function getTitle(pathname: string) {
  const match = findMenuByPath(pathname);
  if (match) {
    return {
      section: match.section.label,
      eyebrow: match.section.label,
      title: match.item.label,
      description: match.item.description,
    };
  }

  if (pathname.startsWith('/requests/')) {
    return {
      section: 'Service Requests',
      eyebrow: 'Service Requests',
      title: 'Request Details',
      description: 'Review request details, customer data, billing, attachments, and activity in one place.',
    };
  }

  return {
    section: 'Dashboard',
    eyebrow: 'Dashboard',
    title: 'Overview',
    description: 'Monitor operations, workload, service status, and actions from a single dashboard.',
  };
}

function getActiveSectionId(pathname: string, visibleMenu: ReturnType<typeof getVisibleMenuHierarchy>) {
  const directMatch = visibleMenu.find((section) =>
    section.items.some((item) => pathname === item.path || pathname.startsWith(`${item.path}/`)),
  );

  if (directMatch) {
    return directMatch.id;
  }

  if (pathname.startsWith('/requests/')) {
    return 'service-requests';
  }

  return visibleMenu[0]?.id ?? null;
}

export function AppLayout() {
  const { role, logout, user } = useAuth();
  const location = useLocation();
  const visibleMenu = getVisibleMenuHierarchy(role);
  const title = getTitle(location.pathname);
  const activeSectionId = useMemo(
    () => getActiveSectionId(location.pathname, visibleMenu),
    [location.pathname, visibleMenu],
  );
  const workspaceDate = useMemo(
    () => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    [],
  );

  const activeSection = visibleMenu.find((s) => s.id === activeSectionId);

  return (
    <div className="app-shell enterprise-shell dense-ops-shell">
      <div className="app-main-shell">
        <header className="app-topbar enterprise-topbar">
          <div className="app-brand-mark topbar-brand-mark">GSH</div>

          <div className="app-topbar-primary">
            <div className="app-context-line" aria-label="Current page">
              <span>{title.section}</span>
              <span>/</span>
              <strong>{title.title}</strong>
            </div>
            <small className="app-context-description">{title.description}</small>
          </div>

          <div className="app-topbar-actions enterprise-actions">
            <span className="topbar-chip">Live Workspace</span>
            <span className="topbar-chip">Updated {workspaceDate}</span>
            <div className="app-user-card">
              <span className="app-user-label">Signed in as</span>
              <strong>{user?.username}</strong>
              <small>{role}</small>
            </div>
            <button className="secondary-button logout-button" onClick={logout} aria-label="Logout">
              Logout
            </button>
          </div>
        </header>

        {/* Horizontal section tabs */}
        <nav className="app-topnav" aria-label="Section navigation">
          <div className="app-topnav-sections">
            {visibleMenu.map((section) => (
              <NavLink
                key={section.id}
                to={section.items[0]?.path ?? '#'}
                className={`topnav-section-tab topnav-tab-${section.accent}${section.id === activeSectionId ? ' active' : ''}`}
              >
                {section.label}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Horizontal item sub-nav for active section */}
        {activeSection && (
          <nav className="app-subnav" aria-label={`${activeSection.label} navigation`}>
            <div className="app-subnav-items">
              {activeSection.items.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={({ isActive }) => `subnav-item${isActive ? ' active' : ''}`}
                >
                  <strong>{item.label}</strong>
                  <span>{item.description}</span>
                </NavLink>
              ))}
            </div>
          </nav>
        )}

        <main className="merchant-main enterprise-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
