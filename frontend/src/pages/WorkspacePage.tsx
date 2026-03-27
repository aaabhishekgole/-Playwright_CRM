import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRequests } from './useRequests';
import { buildWorkspaceView } from '../utils/workspaceData';
import { findMenuContext, hasMenuAccess } from '../utils/menuHierarchy';
import { isOperationalWorkspaceItem, OperationalWorkspacePage } from './OperationalWorkspacePage';
import { PickupImagesPage } from './PickupImagesPage';
import { PickupManagementDashboardPage } from './PickupManagementDashboardPage';

function matchesSearch(query: string, values: string[]) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(normalized));
}

function getQuickActions(sectionId: string) {
  switch (sectionId) {
    case 'dashboard':
      return [
        { label: 'Open Claims', to: '/requests' },
        { label: 'Status Timeline', to: '/timeline' },
      ];
    case 'notifications':
      return [
        { label: 'All Requests', to: '/requests' },
        { label: 'Status Timeline', to: '/timeline' },
      ];
    case 'users':
      return [
        { label: 'Create Request', to: '/workspace/service-requests/create-request' },
        { label: 'Open Claims', to: '/requests' },
      ];
    case 'reports':
      return [
        { label: 'Open Claims', to: '/requests' },
        { label: 'Status Timeline', to: '/timeline' },
      ];
    case 'settings':
      return [
        { label: 'Dashboard', to: '/' },
        { label: 'Status Timeline', to: '/timeline' },
      ];
    case 'audit':
      return [
        { label: 'Status Timeline', to: '/timeline' },
        { label: 'All Requests', to: '/requests' },
      ];
    default:
      return [];
  }
}

function getWorklistTitle(sectionId: string) {
  switch (sectionId) {
    case 'notifications':
      return 'Delivery Log';
    case 'users':
      return 'Directory';
    case 'reports':
      return 'Report Output';
    case 'settings':
      return 'Configuration Status';
    case 'audit':
      return 'Audit Records';
    default:
      return 'Worklist';
  }
}

function getWorklistDescription(sectionId: string, itemDescription: string) {
  switch (sectionId) {
    case 'notifications':
      return 'Track channel activity, retries, and delivery posture for this submenu.';
    case 'users':
      return 'View the workload and profile signals mapped to this submenu.';
    case 'reports':
      return 'Report rows and summary outputs available for this reporting slice.';
    case 'settings':
      return 'Current system signals and configuration posture for this area.';
    case 'audit':
      return 'Review enterprise trace records and workflow evidence for this slice.';
    default:
      return itemDescription;
  }
}

export function WorkspacePage() {
  const { sectionId, itemId } = useParams();
  const { section, item } = findMenuContext(sectionId, itemId);
  const { role } = useAuth();
  const { requests } = useRequests();
  const [query, setQuery] = useState('');

  if (!section || !item) {
    return <Navigate to="/" replace />;
  }

  if (!hasMenuAccess(role, section.id, item.id)) {
    return <Navigate to="/" replace />;
  }

  if (item.id === 'picked-up-devices') {
    return <PickupImagesPage />;
  }

  if (item.id === 'pickup-dashboard') {
    return <PickupManagementDashboardPage />;
  }

  if (isOperationalWorkspaceItem(item.id)) {
    return <OperationalWorkspacePage section={section} item={item} />;
  }

  const view = buildWorkspaceView(section, item, requests);
  const filteredRecords = useMemo(
    () => view.records.filter((record) => matchesSearch(query, [record.title, record.subtitle, record.category, record.owner, record.status, record.amount])),
    [query, view.records],
  );
  const filteredFeed = useMemo(
    () => view.feed.filter((entry) => matchesSearch(query, [entry.title, entry.detail, entry.meta])),
    [query, view.feed],
  );
  const quickActions = useMemo(() => getQuickActions(section.id), [section.id]);

  return (
    <section className="workspace-page phase-two-workspace">
      <div className="page-header merchant-page-header">
        <div>
          <p className="eyebrow">{section.label}</p>
          <h2>{item.label}</h2>
          <p>{item.description}</p>
        </div>
        <div className="workspace-chip-row">
          <span className="workspace-chip">Role: {role ?? 'Unknown'}</span>
          <span className="workspace-chip">Records: {filteredRecords.length}</span>
        </div>
      </div>

      <div className="workspace-stat-grid">
        {view.metrics.map((metric) => (
          <article key={metric.label} className={`card workspace-stat ${metric.tone === 'alert' ? 'tone-alert' : metric.tone === 'ok' ? 'tone-ok' : ''}`}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.helper}</small>
          </article>
        ))}
      </div>

      <div className="workspace-grid">
        <article className="card workspace-panel workspace-panel-wide">
          <div className="split-row workspace-panel-head">
            <div>
              <h3>{getWorklistTitle(section.id)}</h3>
              <p>{getWorklistDescription(section.id, item.description)}</p>
            </div>
            <label className="workspace-search">
              <span>Search</span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view.searchPlaceholder} />
            </label>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="portal-table">
              <div className="portal-table-row portal-table-head">
                <span>Record</span>
                <span>Category</span>
                <span>Owner</span>
                <span>Due</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {filteredRecords.map((record) => (
                <div key={record.id} className="portal-table-row portal-table-body">
                  <div>
                    <strong>{record.link ? <Link to={record.link}>{record.title}</Link> : record.title}</strong>
                    <small>{record.subtitle}</small>
                  </div>
                  <div>{record.category}</div>
                  <div>{record.owner}</div>
                  <div>{record.due}</div>
                  <div>{record.amount}</div>
                  <div><span className="status-badge workspace-status-badge">{record.status}</span></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="workspace-empty">
              <strong>No records available</strong>
              <p>{view.emptyState}</p>
            </div>
          )}
        </article>

        <article className="card workspace-panel">
          <div className="workspace-panel-head">
            <h3>Quick Actions</h3>
            <p>Jump into the most useful live pages from this submenu.</p>
          </div>
          <div className="workspace-links compact-links">
            {quickActions.map((action) => (
              <Link key={action.to} to={action.to} className="workspace-link">
                <strong>{action.label}</strong>
                <span>Open the linked live workspace.</span>
              </Link>
            ))}
          </div>
          <div className="workspace-panel-head">
            <h3>Related Modules</h3>
            <p>Move between pages in the same section.</p>
          </div>
          <div className="workspace-links compact-links">
            {section.items.map((entry) => (
              <Link key={entry.id} to={entry.path} className={`workspace-link ${entry.id === item.id ? 'active' : ''}`}>
                <strong>{entry.label}</strong>
                <span>{entry.description}</span>
              </Link>
            ))}
          </div>
        </article>
      </div>

      <div className="workspace-grid two-col">
        <article className="card workspace-panel">
          <div className="workspace-panel-head">
            <h3>{view.feedTitle}</h3>
            <p>Recent events and updates relevant to this workflow.</p>
          </div>
          <div className="workspace-feed-list">
            {filteredFeed.length > 0 ? filteredFeed.map((entry) => (
              <div key={entry.id} className={`workspace-feed-item ${entry.tone === 'alert' ? 'tone-alert-soft' : entry.tone === 'ok' ? 'tone-ok-soft' : ''}`}>
                <strong>{entry.title}</strong>
                <p>{entry.detail}</p>
                <small>{entry.meta}</small>
              </div>
            )) : (
              <div className="workspace-empty">
                <strong>No recent feed items</strong>
                <p>Try a broader search or wait for new workflow activity.</p>
              </div>
            )}
          </div>
        </article>

        <article className="card workspace-panel">
          <div className="workspace-panel-head">
            <h3>{view.insightsTitle}</h3>
            <p>Summary indicators to support the next action in this workflow.</p>
          </div>
          <div className="workspace-insight-list">
            {view.insights.map((insight) => (
              <div key={insight.label} className={`workspace-insight ${insight.tone === 'alert' ? 'tone-alert-soft' : insight.tone === 'ok' ? 'tone-ok-soft' : ''}`}>
                <div>
                  <strong>{insight.label}</strong>
                  <p>{insight.helper}</p>
                </div>
                <span>{insight.value}</span>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
