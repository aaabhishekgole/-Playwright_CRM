import { useEffect, useMemo, useState } from 'react';
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
  const [expandedSectionId, setExpandedSectionId] = useState<string | null>(activeSectionId);

  const sectionCount = visibleMenu.length;
  const routeCount = useMemo(
    () => visibleMenu.reduce((total, section) => total + section.items.length, 0),
    [visibleMenu],
  );
  const workspaceDate = useMemo(
    () => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date()),
    [],
  );

  useEffect(() => {
    setExpandedSectionId(activeSectionId);
  }, [activeSectionId]);

  function toggleSection(sectionId: string) {
    setExpandedSectionId((current) => (current === sectionId ? null : sectionId));
  }

  return (
    <div className="app-shell enterprise-shell dense-ops-shell">
      <aside className="app-sidebar">
        <div className="app-sidebar-inner">
          <div className="app-brand enterprise-brand">
            <div className="app-brand-mark">GSH</div>
            <div>
              <p className="eyebrow">Gadget Seva Hub</p>
              <h1>Ops Console</h1>
              <small>Claims, pickup, repair, delivery, billing, and audit on one compact workspace.</small>
            </div>
          </div>

          <div className="sidebar-summary-grid">
            <article className="sidebar-summary-card">
              <span>Sections</span>
              <strong>{sectionCount}</strong>
              <small>Role-aware workspace groups</small>
            </article>
            <article className="sidebar-summary-card">
              <span>Routes</span>
              <strong>{routeCount}</strong>
              <small>Operational queues and actions</small>
            </article>
          </div>

          <div className="sidebar-section-frame">
            <div className="sidebar-frame-head">
              <strong>Ops Modules</strong>
              <small>{role ?? 'USER'} access profile</small>
            </div>

            <nav className="sidebar-nav" aria-label="Application navigation">
              {visibleMenu.map((section) => (
                <section key={section.id} className={`sidebar-section sidebar-${section.accent}`}>
                  <button
                    type="button"
                    className={`sidebar-section-toggle${expandedSectionId === section.id ? ' active' : ''}`}
                    onClick={() => toggleSection(section.id)}
                    aria-expanded={expandedSectionId === section.id}
                  >
                    <div className="sidebar-section-head">
                      <strong>{section.label}</strong>
                      <span>{section.description}</span>
                    </div>
                    <span className="sidebar-section-icon" aria-hidden="true">
                      {expandedSectionId === section.id ? '-' : '+'}
                    </span>
                  </button>

                  <div className={`sidebar-links${expandedSectionId === section.id ? ' open' : ''}`}>
                    {section.items.map((item) => (
                      <NavLink
                        key={item.id}
                        to={item.path}
                        className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                      >
                        <strong>{item.label}</strong>
                        <span>{item.description}</span>
                      </NavLink>
                    ))}
                  </div>
                </section>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer-note">
            <span>India-first operations workspace</span>
            <strong>{workspaceDate}</strong>
            <small>Designed for support, pickup, service-center, delivery, and finance teams.</small>
          </div>
        </div>
      </aside>

      <div className="app-main-shell">
        <header className="app-topbar enterprise-topbar">
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

        <main className="merchant-main enterprise-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
