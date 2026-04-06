import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { StatusBadge } from '../components/StatusBadge';
import { formatDeviceCategory } from '../utils/deviceCatalog';
import { formatCurrencyInr, formatDateIn } from '../utils/formatters';
import { getWorkflowStageMeta } from '../utils/workflowStages';
import type { ServiceRequest } from '../types/models';
import { useRequests } from './useRequests';

type ServiceRequestListPageProps = {
  mode?: 'all' | 'open' | 'in-progress' | 'closed' | 'cancelled' | 'sla' | 'alerts';
  title?: string;
  description?: string;
};

type QueueFilters = {
  loanNumber: string;
  mobileNumber: string;
  certificateOfInsuranceNumber: string;
  ticketNumber: string;
  deviceIdentifier: string;
  statuses: string[];
  settlements: string[];
};

const emptyFilters: QueueFilters = {
  loanNumber: '',
  mobileNumber: '',
  certificateOfInsuranceNumber: '',
  ticketNumber: '',
  deviceIdentifier: '',
  statuses: [],
  settlements: [],
};

function humanize(value?: string | null) {
  return value?.replaceAll('_', ' ') ?? '';
}

function matchesText(source: string | null | undefined, query: string) {
  if (!query.trim()) {
    return true;
  }

  return (source ?? '').toLowerCase().includes(query.trim().toLowerCase());
}

function isOpenRequest(request: ServiceRequest) {
  return !['CLOSED', 'CANCELLED'].includes(request.status);
}

function isInProgressRequest(request: ServiceRequest) {
  return !['REQUEST_CREATED', 'CLOSED', 'CANCELLED'].includes(request.status);
}

function isClosedRequest(request: ServiceRequest) {
  return request.status === 'CLOSED';
}

function isCancelledRequest(request: ServiceRequest) {
  return request.status === 'CANCELLED';
}

function getClaimSettlement(request: ServiceRequest) {
  if (request.status === 'CLOSED' && !request.invoice) {
    return 'Closed without Claim - Not to be billed';
  }

  if (!request.technician) {
    return 'ASC Not Yet Assigned';
  }

  if ((request.invoice?.amountDue ?? 0) > 0) {
    return 'Pending for Payment of Excess / Co-Pay / Deductible / SO Charges';
  }

  if (request.invoice && request.invoice.amountDue <= 0) {
    return 'Settled / Paid';
  }

  return 'In Progress';
}

function applyFilters(requests: ServiceRequest[], filters: QueueFilters) {
  return requests.filter((request) => {
    const statusMatch = filters.statuses.length === 0 || filters.statuses.includes(request.status);
    const settlement = getClaimSettlement(request);
    const settlementMatch = filters.settlements.length === 0 || filters.settlements.includes(settlement);

    return statusMatch
      && settlementMatch
      && matchesText(request.loanNumber, filters.loanNumber)
      && matchesText(request.customerPhone, filters.mobileNumber)
      && matchesText(request.certificateOfInsuranceNumber, filters.certificateOfInsuranceNumber)
      && matchesText(request.requestNumber, filters.ticketNumber)
      && (
        matchesText(request.imeiNumber, filters.deviceIdentifier)
        || matchesText(request.serialNumber, filters.deviceIdentifier)
        || matchesText(request.deviceLabel, filters.deviceIdentifier)
      );
  });
}

type MultiSelectFilterProps = {
  label: string;
  options: string[];
  values: string[];
  open: boolean;
  onToggle: () => void;
  onChange: (next: string[]) => void;
};

function MultiSelectFilter({ label, options, values, open, onToggle, onChange }: MultiSelectFilterProps) {
  const [query, setQuery] = useState('');
  const filteredOptions = options.filter((option) => option.toLowerCase().includes(query.toLowerCase()));

  function toggleValue(option: string) {
    onChange(values.includes(option) ? values.filter((value) => value !== option) : [...values, option]);
    onToggle();
  }

  return (
    <div className="portal-field portal-multiselect">
      <span>{label}</span>
      <button className="portal-multiselect-trigger" type="button" onClick={onToggle}>
        <strong>{values.length > 0 ? `${values.length} Selected` : 'Select'}</strong>
        <span>{open ? '-' : '+'}</span>
      </button>
      {open ? (
        <div className="portal-multiselect-menu">
          <input
            className="portal-multiselect-search"
            placeholder="Search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="portal-link-button" type="button" onClick={() => onChange([])}>Unselect All</button>
          <div className="portal-multiselect-options">
            {filteredOptions.map((option) => (
              <label className="portal-multiselect-option" key={option}>
                <input checked={values.includes(option)} type="checkbox" onChange={() => toggleValue(option)} />
                <span>{humanize(option)}</span>
              </label>
            ))}
            {filteredOptions.length === 0 ? <small className="portal-muted">No matching options.</small> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ServiceRequestListPage({
  mode = 'all',
  title = 'Open Claims',
  description = 'Search and filter live claims using ticket, customer, device, call-status, and settlement signals.',
}: ServiceRequestListPageProps) {
  const { requests, loading, error } = useRequests();
  const baseRequests = useMemo(() => {
    switch (mode) {
      case 'open':
        return requests.filter(isOpenRequest);
      case 'in-progress':
        return requests.filter(isInProgressRequest);
      case 'closed':
        return requests.filter(isClosedRequest);
      case 'cancelled':
        return requests.filter(isCancelledRequest);
      case 'sla':
        return requests.filter((request) => request.slaBreached || isOpenRequest(request));
      case 'alerts':
        return requests.filter((request) => request.slaBreached || request.notifications.some((notification) => notification.deliveryStatus !== 'SENT'));
      default:
        return requests;
    }
  }, [mode, requests]);

  const [draftFilters, setDraftFilters] = useState<QueueFilters>(emptyFilters);
  const [activeFilters, setActiveFilters] = useState<QueueFilters>(emptyFilters);
  const [openDropdown, setOpenDropdown] = useState<'status' | 'settlement' | null>(null);

  const statusOptions = useMemo(() => Array.from(new Set(baseRequests.map((request) => request.status))).sort(), [baseRequests]);
  const settlementOptions = useMemo(() => Array.from(new Set(baseRequests.map((request) => getClaimSettlement(request)))).sort(), [baseRequests]);
  const filteredRequests = useMemo(() => applyFilters(baseRequests, activeFilters), [activeFilters, baseRequests]);
  const pendingSettlements = filteredRequests.filter((request) => getClaimSettlement(request).includes('Pending')).length;
  const totalDue = filteredRequests.reduce((sum, request) => sum + (request.invoice?.amountDue ?? 0), 0);
  const activeFilterCount = activeFilters.statuses.length
    + activeFilters.settlements.length
    + [activeFilters.loanNumber, activeFilters.mobileNumber, activeFilters.certificateOfInsuranceNumber, activeFilters.ticketNumber, activeFilters.deviceIdentifier]
      .filter((value) => value.trim()).length;

  function updateDraft<K extends keyof QueueFilters>(key: K, value: QueueFilters[K]) {
    setDraftFilters((current) => ({ ...current, [key]: value }));
  }

  function handleSearch() {
    setActiveFilters(draftFilters);
    setOpenDropdown(null);
  }

  function handleReset() {
    setDraftFilters(emptyFilters);
    setActiveFilters(emptyFilters);
    setOpenDropdown(null);
  }

  return (
    <section className="portal-page dense-ops-page service-request-queue-page">
      <div className="portal-titlebar dense-ops-titlebar">
        <div>
          <p className="eyebrow">Claims queue</p>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="workspace-chip-row">
          <span className="workspace-chip">Records: {filteredRequests.length}</span>
          <span className="workspace-chip">Active filters: {activeFilterCount}</span>
        </div>
      </div>

      <article className="card portal-panel dense-ops-filter-panel">
        <div className="portal-filter-grid">
          <label className="portal-field">
            <span>Loan No.</span>
            <input value={draftFilters.loanNumber} onChange={(event) => updateDraft('loanNumber', event.target.value)} />
          </label>
          <label className="portal-field">
            <span>Mobile No.</span>
            <input value={draftFilters.mobileNumber} onChange={(event) => updateDraft('mobileNumber', event.target.value)} />
          </label>
          <label className="portal-field">
            <span>COI No.</span>
            <input value={draftFilters.certificateOfInsuranceNumber} onChange={(event) => updateDraft('certificateOfInsuranceNumber', event.target.value)} />
          </label>
          <label className="portal-field">
            <span>Ticket No.</span>
            <input value={draftFilters.ticketNumber} onChange={(event) => updateDraft('ticketNumber', event.target.value)} />
          </label>
          <label className="portal-field portal-field-wide">
            <span>IMEI / Product Serial No.</span>
            <input value={draftFilters.deviceIdentifier} onChange={(event) => updateDraft('deviceIdentifier', event.target.value)} />
          </label>
          <MultiSelectFilter
            label="Call Status"
            open={openDropdown === 'status'}
            options={statusOptions}
            values={draftFilters.statuses}
            onToggle={() => setOpenDropdown((current) => (current === 'status' ? null : 'status'))}
            onChange={(next) => updateDraft('statuses', next)}
          />
          <MultiSelectFilter
            label="Claim Settlement"
            open={openDropdown === 'settlement'}
            options={settlementOptions}
            values={draftFilters.settlements}
            onToggle={() => setOpenDropdown((current) => (current === 'settlement' ? null : 'settlement'))}
            onChange={(next) => updateDraft('settlements', next)}
          />
          <div className="portal-button-row">
            <button className="portal-button portal-button-search" type="button" onClick={handleSearch}>Search</button>
            <button className="portal-button portal-button-secondary" type="button" onClick={handleReset}>Reset</button>
          </div>
        </div>
      </article>

      <div className="summary-grid">
        <article className="summary-stat">
          <span>Visible claims</span>
          <strong>{filteredRequests.length}</strong>
          <small>Claims that match the current portal filters.</small>
        </article>
        <article className="summary-stat">
          <span>Open claims</span>
          <strong>{filteredRequests.filter(isOpenRequest).length}</strong>
          <small>Claims still requiring field or backend action.</small>
        </article>
        <article className="summary-stat">
          <span>Pending settlement</span>
          <strong>{pendingSettlements}</strong>
          <small>Claims waiting for deductible, co-pay, or settlement action.</small>
        </article>
        <article className="summary-stat">
          <span>Outstanding value</span>
          <strong>{formatCurrencyInr(totalDue)}</strong>
          <small>Current visible due amount across the filtered set.</small>
        </article>
      </div>

      <article className="card portal-results-panel dense-ops-results-panel">
        <div className="split-row">
          <div>
            <h3>Claims Queue</h3>
            <p>Search by ticket, customer, identifier, live call status, and settlement position without leaving the queue.</p>
          </div>
          <Link className="secondary-button" to="/workspace/service-requests/create-request">Register New Claim</Link>
        </div>

        {error ? <div className="workspace-empty"><strong>Unable to load claims</strong><p>{error}</p></div> : null}
        {loading && filteredRequests.length === 0 ? <div className="workspace-empty"><strong>Loading claims</strong><p>Please wait while portal data is fetched.</p></div> : null}

        {filteredRequests.length > 0 ? (
          <div className="portal-table">
            <div className="portal-table-row portal-table-head">
              <span>Ticket No.</span>
              <span>Customer</span>
              <span>Mobile No.</span>
              <span>Loan / COI</span>
              <span>Device</span>
              <span>Call Status</span>
              <span>Claim Settlement</span>
              <span>Amount Due</span>
              <span>Updated</span>
            </div>
            {filteredRequests.map((request) => (
              <div className="portal-table-row portal-table-body" key={request.id}>
                <div>
                  <Link to={`/requests/${request.id}`}>{request.requestNumber}</Link>
                  <small>{request.previousTicketNumber ?? 'Fresh registration'}</small>
                </div>
                <div>
                  <strong>{request.customerName}</strong>
                  <small>{request.contactPerson ?? 'Self'}</small>
                </div>
                <div>
                  <strong>{request.customerPhone}</strong>
                  <small>{request.alternatePhone ?? 'No alternate'}</small>
                </div>
                <div>
                  <strong>{request.loanNumber ?? 'No loan ref'}</strong>
                  <small>{request.certificateOfInsuranceNumber ?? 'No COI'}</small>
                </div>
                <div>
                  <strong>{formatDeviceCategory(request.deviceCategory)}</strong>
                  <small>{request.imeiNumber ?? request.serialNumber}</small>
                </div>
                <div>
                  <StatusBadge status={request.status} />
                  <small>{getWorkflowStageMeta(request).label}</small>
                </div>
                <div><span className="workspace-chip">{getClaimSettlement(request)}</span></div>
                <div>{request.invoice ? formatCurrencyInr(request.invoice.amountDue) : 'Pending invoice'}</div>
                <div>{formatDateIn(request.updatedAt)}</div>
              </div>
            ))}
          </div>
        ) : (!loading && !error ? (
          <div className="workspace-empty">
            <strong>No claims found</strong>
            <p>Adjust the filters or register a new claim to begin the portal workflow.</p>
          </div>
        ) : null)}
      </article>
    </section>
  );
}
