import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRequests } from './useRequests';
import { buildWorkspaceView } from '../utils/workspaceData';
import { findMenuContext, hasMenuAccess } from '../utils/menuHierarchy';

function matchesSearch(query: string, values: string[]) {
  if (!query) {
    return true;
  }

  const normalized = query.toLowerCase();
  return values.some((value) => value.toLowerCase().includes(normalized));
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

  const view = buildWorkspaceView(section, item, requests);
  const filteredRecords = useMemo(
    () => view.records.filter((record) => matchesSearch(query, [record.title, record.subtitle, record.category, record.owner, record.status, record.amount])),
    [query, view.records],
  );
  const filteredFeed = useMemo(
    () => view.feed.filter((entry) => matchesSearch(query, [entry.title, entry.detail, entry.meta])),
    [query, view.feed],
  );

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

      <article className={`card workspace-stage-hero ${section.accent}`}>
        <div>
          <p className="eyebrow">Module overview</p>
          <h3>{view.heroTitle}</h3>
          <p>{view.heroDescription}</p>
        </div>
        <div className="workspace-controls">
          <label className="workspace-search">
            <span>Search this module</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={view.searchPlaceholder} />
          </label>
          <div className="workspace-support-copy">
            <strong>Workflow guidance</strong>
            <span>Use search and the related module list to move through the current workflow without losing context.</span>
          </div>
        </div>
      </article>

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
              <h3>Worklist</h3>
              <p>Records for the current module based on the active request data.</p>
            </div>
            <span className="workspace-subtle">{filteredRecords.length} visible rows</span>
          </div>

          {filteredRecords.length > 0 ? (
            <div className="workspace-record-table">
              <div className="workspace-record-row workspace-record-head">
                <span>Record</span>
                <span>Category</span>
                <span>Owner</span>
                <span>Due</span>
                <span>Amount</span>
                <span>Status</span>
              </div>
              {filteredRecords.map((record) => (
                <div key={record.id} className={`workspace-record-row workspace-record-body ${record.tone === 'alert' ? 'tone-alert-soft' : record.tone === 'ok' ? 'tone-ok-soft' : ''}`}>
                  <div>
                    <strong>{record.link ? <Link to={record.link}>{record.title}</Link> : record.title}</strong>
                    <small>{record.subtitle}</small>
                  </div>
                  <span>{record.category}</span>
                  <span>{record.owner}</span>
                  <span>{record.due}</span>
                  <span>{record.amount}</span>
                  <span className="status-badge workspace-status-badge">{record.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="workspace-empty">
              <strong>No matching records</strong>
              <p>{view.emptyState}</p>
            </div>
          )}
        </article>

        <article className="card workspace-panel">
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
