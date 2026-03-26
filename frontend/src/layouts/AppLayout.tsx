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

  useEffect(() => {
    setExpandedSectionId(activeSectionId);
  }, [activeSectionId]);

  function toggleSection(sectionId: string) {
    setExpandedSectionId((current) => (current === sectionId ? null : sectionId));
  }

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <div className="app-brand">
          <div className="app-brand-mark">GSH</div>
          <div>
            <p className="eyebrow">Gadget Seva Hub</p>
            <h1>Operations Console</h1>
            <small>Claims, pickup, repair, delivery, billing, and audit management.</small>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Application navigation">
          {visibleMenu.map((section) => (
            <section key={section.id} className="sidebar-section">
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
      </aside>

      <div className="app-main-shell">
        <header className="app-topbar">
          <div className="app-topbar-copy">
            <p className="eyebrow">{title.eyebrow}</p>
            <h2>{title.title}</h2>
            <p>{title.description}</p>
          </div>

          <div className="app-topbar-actions">
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

        <div className="page-summary-bar">
          <span>{title.section}</span>
          <span>/</span>
          <span>{title.title}</span>
        </div>

        <main className="merchant-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
