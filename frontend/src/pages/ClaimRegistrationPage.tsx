import { useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../hooks/useToast';
import { getApiErrorMessage } from '../services/api';
import { supportedRepairCategories, usesImei } from '../utils/deviceCatalog';
import type { CreateServiceRequestPayload, ServiceRequest } from '../types/models';
import { useRequests } from './useRequests';

type SearchState = {
  loanNumber: string;
  mobileNumber: string;
  deviceIdentifier: string;
  certificateOfInsuranceNumber: string;
  previousTicketNumber: string;
};

type ClaimFormState = {
  customerName: string;
  contactPerson: string;
  phone: string;
  alternatePhone: string;
  whatsappNumber: string;
  email: string;
  secondaryEmail: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  googleMapLink: string;
  city: string;
  state: string;
  postalCode: string;
  loanNumber: string;
  certificateOfInsuranceNumber: string;
  previousTicketNumber: string;
  projectName: string;
  branchName: string;
  employeeCode: string;
  employeeName: string;
  deviceCategory: string;
  brand: string;
  model: string;
  serialNumber: string;
  imeiNumber: string;
  warrantyStatus: string;
  deviceCondition: string;
  qrCodePayload: string;
  issueSummary: string;
  issueDescription: string;
  priority: CreateServiceRequestPayload['priority'];
  sourceChannel: string;
  partnerReference: string;
  promisedSlaHours: string;
};

const emptySearch: SearchState = {
  loanNumber: '',
  mobileNumber: '',
  deviceIdentifier: '',
  certificateOfInsuranceNumber: '',
  previousTicketNumber: '',
};

const emptyForm: ClaimFormState = {
  customerName: '',
  contactPerson: '',
  phone: '',
  alternatePhone: '',
  whatsappNumber: '',
  email: '',
  secondaryEmail: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  googleMapLink: '',
  city: '',
  state: '',
  postalCode: '',
  loanNumber: '',
  certificateOfInsuranceNumber: '',
  previousTicketNumber: '',
  projectName: 'FG - Mobile All Risk IDFC',
  branchName: '',
  employeeCode: '',
  employeeName: '',
  deviceCategory: 'MOBILE',
  brand: '',
  model: '',
  serialNumber: '',
  imeiNumber: '',
  warrantyStatus: 'IN_WARRANTY',
  deviceCondition: '',
  qrCodePayload: '',
  issueSummary: '',
  issueDescription: '',
  priority: 'MEDIUM',
  sourceChannel: 'PORTAL',
  partnerReference: '',
  promisedSlaHours: '48',
};

function matchesRequest(request: ServiceRequest, lookup: SearchState) {
  const match = (value: string | null | undefined, query: string) => !query || (value ?? '').toLowerCase().includes(query.toLowerCase());
  return match(request.loanNumber, lookup.loanNumber)
    && match(request.customerPhone, lookup.mobileNumber)
    && (
      !lookup.deviceIdentifier
      || match(request.imeiNumber, lookup.deviceIdentifier)
      || match(request.serialNumber, lookup.deviceIdentifier)
      || match(request.deviceLabel, lookup.deviceIdentifier)
    )
    && match(request.certificateOfInsuranceNumber, lookup.certificateOfInsuranceNumber)
    && match(request.previousTicketNumber, lookup.previousTicketNumber);
}

function splitDeviceLabel(deviceLabel: string) {
  const parts = deviceLabel.trim().split(/\s+/);
  return {
    brand: parts[0] ?? deviceLabel,
    model: parts.slice(1).join(' '),
  };
}

export function ClaimRegistrationPage() {
  const { requests, loading, createRequest } = useRequests();
  const { showError, showInfo, showSuccess } = useToast();
  const [lookup, setLookup] = useState<SearchState>(emptySearch);
  const [matches, setMatches] = useState<ServiceRequest[]>([]);
  const [form, setForm] = useState<ClaimFormState>(emptyForm);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [createdRequest, setCreatedRequest] = useState<ServiceRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const expectsImei = useMemo(() => usesImei(form.deviceCategory), [form.deviceCategory]);

  function updateLookup<K extends keyof SearchState>(key: K, value: SearchState[K]) {
    setLookup((current) => ({ ...current, [key]: value }));
  }

  function updateForm<K extends keyof ClaimFormState>(key: K, value: ClaimFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSearch() {
    const nextMatches = requests.filter((request) => matchesRequest(request, lookup));
    setMatches(nextMatches);
    setCreatedRequest(null);
    setError(null);
    const nextMessage = nextMatches.length > 0
      ? `${nextMatches.length} matching claim(s) found.`
      : 'No existing claim found. Continue with a new registration.';
    setStatusMessage(nextMessage);
    showInfo(nextMessage, 'Claim search updated');
  }

  function handleDeviceNotInDatabase() {
    setMatches([]);
    setCreatedRequest(null);
    setError(null);
    const nextMessage = 'Switched to fresh registration mode. Enter the claim details below.';
    setStatusMessage(nextMessage);
    showInfo(nextMessage, 'Fresh claim mode');
  }

  function loadFromRequest(request: ServiceRequest) {
    const device = splitDeviceLabel(request.deviceLabel);
    setForm({
      customerName: request.customerName,
      contactPerson: request.contactPerson ?? request.customerName,
      phone: request.customerPhone,
      alternatePhone: request.alternatePhone ?? '',
      whatsappNumber: request.whatsappNumber ?? request.customerPhone,
      email: request.customerEmail ?? '',
      secondaryEmail: request.secondaryEmail ?? '',
      addressLine1: request.customerAddress ?? '',
      addressLine2: '',
      landmark: request.landmark ?? '',
      googleMapLink: request.googleMapLink ?? '',
      city: request.customerCity ?? '',
      state: request.customerState ?? '',
      postalCode: request.customerPostalCode ?? '',
      loanNumber: request.loanNumber ?? '',
      certificateOfInsuranceNumber: request.certificateOfInsuranceNumber ?? '',
      previousTicketNumber: request.requestNumber,
      projectName: request.projectName ?? emptyForm.projectName,
      branchName: request.branchName ?? '',
      employeeCode: request.employeeCode ?? '',
      employeeName: request.employeeName ?? '',
      deviceCategory: request.deviceCategory,
      brand: device.brand,
      model: device.model,
      serialNumber: request.serialNumber,
      imeiNumber: request.imeiNumber ?? '',
      warrantyStatus: emptyForm.warrantyStatus,
      deviceCondition: '',
      qrCodePayload: request.qrCodePayload ?? '',
      issueSummary: request.issueSummary,
      issueDescription: request.issueDescription,
      priority: request.priority,
      sourceChannel: request.sourceChannel,
      partnerReference: request.partnerReference ?? '',
      promisedSlaHours: emptyForm.promisedSlaHours,
    });
    const nextMessage = `Loaded details from ${request.requestNumber}. Review and submit a new claim when ready.`;
    setStatusMessage(nextMessage);
    showInfo(nextMessage, 'Claim details loaded');
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);

    const payload: CreateServiceRequestPayload = {
      customer: {
        fullName: form.customerName,
        contactPerson: form.contactPerson || undefined,
        email: form.email || undefined,
        secondaryEmail: form.secondaryEmail || undefined,
        phone: form.phone,
        alternatePhone: form.alternatePhone || undefined,
        whatsappNumber: form.whatsappNumber || undefined,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2 || undefined,
        landmark: form.landmark || undefined,
        googleMapLink: form.googleMapLink || undefined,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
      },
      device: {
        brand: form.brand,
        model: form.model,
        deviceCategory: form.deviceCategory,
        serialNumber: form.serialNumber,
        imeiNumber: expectsImei ? form.imeiNumber || undefined : undefined,
        warrantyStatus: form.warrantyStatus,
        deviceCondition: form.deviceCondition || undefined,
        qrCodePayload: form.qrCodePayload || undefined,
      },
      issueSummary: form.issueSummary,
      issueDescription: form.issueDescription || undefined,
      priority: form.priority,
      sourceChannel: form.sourceChannel,
      tenantCode: 'GSH-CORE',
      loanNumber: form.loanNumber || undefined,
      certificateOfInsuranceNumber: form.certificateOfInsuranceNumber || undefined,
      previousTicketNumber: form.previousTicketNumber || undefined,
      partnerReference: form.partnerReference || undefined,
      projectName: form.projectName || undefined,
      branchName: form.branchName || undefined,
      employeeCode: form.employeeCode || undefined,
      employeeName: form.employeeName || undefined,
      promisedSlaHours: form.promisedSlaHours ? Number(form.promisedSlaHours) : undefined,
    };

    try {
      const created = await createRequest(payload);
      setCreatedRequest(created);
      setMatches([]);
      setLookup(emptySearch);
      setForm({ ...emptyForm, projectName: form.projectName, branchName: form.branchName, employeeCode: form.employeeCode, employeeName: form.employeeName });
      const nextMessage = `Claim ${created.requestNumber} has been registered and stored successfully.`;
      setStatusMessage(nextMessage);
      showSuccess(nextMessage, 'Claim registered');
    } catch (nextError) {
      const nextMessage = getApiErrorMessage(nextError);
      setError(nextMessage);
      showError(nextMessage, 'Claim registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="portal-page">
      <div className="portal-titlebar">
        <h2>Register New Claim</h2>
      </div>

      <article className="card portal-panel">
        <div className="portal-filter-grid portal-filter-grid-claim">
          <label className="portal-field">
            <span>Loan No.</span>
            <input value={lookup.loanNumber} onChange={(event) => updateLookup('loanNumber', event.target.value)} />
          </label>
          <label className="portal-field">
            <span>Mobile No.</span>
            <input value={lookup.mobileNumber} onChange={(event) => updateLookup('mobileNumber', event.target.value)} />
          </label>
          <label className="portal-field portal-field-wide">
            <span>IMEI / Product Serial No.</span>
            <input value={lookup.deviceIdentifier} onChange={(event) => updateLookup('deviceIdentifier', event.target.value)} />
          </label>
          <label className="portal-field">
            <span>Certificate of Insurance No.</span>
            <input value={lookup.certificateOfInsuranceNumber} onChange={(event) => updateLookup('certificateOfInsuranceNumber', event.target.value)} />
          </label>
          <label className="portal-field">
            <span>Previous Ticket No.</span>
            <input value={lookup.previousTicketNumber} onChange={(event) => updateLookup('previousTicketNumber', event.target.value)} />
          </label>
          <div className="portal-button-row">
            <button className="portal-button portal-button-search" type="button" onClick={handleSearch}>Search</button>
            <button className="portal-button portal-button-secondary" type="button" onClick={handleDeviceNotInDatabase}>Device not in database</button>
          </div>
        </div>
      </article>

      {statusMessage ? <div className="portal-banner portal-banner-info">{statusMessage}</div> : null}
      {error ? <div className="portal-banner portal-banner-error">{error}</div> : null}

      {matches.length > 0 ? (
        <article className="card portal-panel">
          <div className="portal-section-header">
            <h3>Matched Claims</h3>
            <p>Select a claim to inspect it or preload details for a new registration.</p>
          </div>
          <div className="portal-match-grid">
            {matches.map((request) => (
              <article className="portal-match-card" key={request.id}>
                <div>
                  <strong>{request.requestNumber}</strong>
                  <p>{request.customerName} | {request.customerPhone}</p>
                  <small>{request.imeiNumber ?? request.serialNumber}</small>
                </div>
                <div className="portal-action-row">
                  <button className="portal-button portal-button-secondary" type="button" onClick={() => loadFromRequest(request)}>Load details</button>
                  <Link className="secondary-button" to={`/requests/${request.id}`}>Open claim</Link>
                </div>
              </article>
            ))}
          </div>
        </article>
      ) : null}

      <form className="card portal-panel portal-form-panel" onSubmit={handleSubmit}>
        <div className="portal-titlebar portal-inner-titlebar">
          <h3>Ticket Registration</h3>
        </div>

        <div className="portal-subsection">
          <div className="portal-section-header compact"><h4>Customer Information</h4></div>
          <div className="portal-form-grid two-col">
            <label className="portal-field"><span>Customer Name *</span><input required value={form.customerName} onChange={(event) => updateForm('customerName', event.target.value)} /></label>
            <label className="portal-field"><span>Contact Person</span><input value={form.contactPerson} onChange={(event) => updateForm('contactPerson', event.target.value)} /></label>
            <label className="portal-field"><span>Mobile No. *</span><input required value={form.phone} onChange={(event) => updateForm('phone', event.target.value)} /></label>
            <label className="portal-field"><span>Mobile No. 2</span><input value={form.alternatePhone} onChange={(event) => updateForm('alternatePhone', event.target.value)} /></label>
            <label className="portal-field"><span>WhatsApp No.</span><input value={form.whatsappNumber} onChange={(event) => updateForm('whatsappNumber', event.target.value)} /></label>
            <label className="portal-field"><span>Email ID - 1</span><input type="email" value={form.email} onChange={(event) => updateForm('email', event.target.value)} /></label>
            <label className="portal-field"><span>Email ID - 2</span><input type="email" value={form.secondaryEmail} onChange={(event) => updateForm('secondaryEmail', event.target.value)} /></label>
            <label className="portal-field"><span>Landmark</span><input value={form.landmark} onChange={(event) => updateForm('landmark', event.target.value)} /></label>
            <label className="portal-field portal-field-span-2"><span>Address *</span><textarea required rows={3} value={form.addressLine1} onChange={(event) => updateForm('addressLine1', event.target.value)} /></label>
            <label className="portal-field"><span>Address Line 2</span><input value={form.addressLine2} onChange={(event) => updateForm('addressLine2', event.target.value)} /></label>
            <label className="portal-field portal-field-span-2"><span>Google Map</span><input value={form.googleMapLink} onChange={(event) => updateForm('googleMapLink', event.target.value)} /></label>
            <label className="portal-field"><span>PIN Code *</span><input required value={form.postalCode} onChange={(event) => updateForm('postalCode', event.target.value)} /></label>
            <label className="portal-field"><span>City *</span><input required value={form.city} onChange={(event) => updateForm('city', event.target.value)} /></label>
            <label className="portal-field"><span>State *</span><input required value={form.state} onChange={(event) => updateForm('state', event.target.value)} /></label>
            <label className="portal-field"><span>Project</span><input value={form.projectName} onChange={(event) => updateForm('projectName', event.target.value)} /></label>
            <label className="portal-field"><span>Branch</span><input value={form.branchName} onChange={(event) => updateForm('branchName', event.target.value)} /></label>
            <label className="portal-field"><span>Emp Code</span><input value={form.employeeCode} onChange={(event) => updateForm('employeeCode', event.target.value)} /></label>
            <label className="portal-field"><span>Emp Name</span><input value={form.employeeName} onChange={(event) => updateForm('employeeName', event.target.value)} /></label>
          </div>
        </div>

        <div className="portal-subsection">
          <div className="portal-section-header compact"><h4>Claim and Device Information</h4></div>
          <div className="portal-form-grid two-col">
            <label className="portal-field"><span>Loan No.</span><input value={form.loanNumber} onChange={(event) => updateForm('loanNumber', event.target.value)} /></label>
            <label className="portal-field"><span>Certificate of Insurance No.</span><input value={form.certificateOfInsuranceNumber} onChange={(event) => updateForm('certificateOfInsuranceNumber', event.target.value)} /></label>
            <label className="portal-field"><span>Previous Ticket No.</span><input value={form.previousTicketNumber} onChange={(event) => updateForm('previousTicketNumber', event.target.value)} /></label>
            <label className="portal-field"><span>Partner Reference</span><input value={form.partnerReference} onChange={(event) => updateForm('partnerReference', event.target.value)} /></label>
            <label className="portal-field"><span>Repair Category *</span><select value={form.deviceCategory} onChange={(event) => updateForm('deviceCategory', event.target.value)}>{supportedRepairCategories.map((category) => <option key={category.id} value={category.id}>{category.label}</option>)}</select></label>
            <label className="portal-field"><span>Brand *</span><input required value={form.brand} onChange={(event) => updateForm('brand', event.target.value)} /></label>
            <label className="portal-field"><span>Model *</span><input required value={form.model} onChange={(event) => updateForm('model', event.target.value)} /></label>
            <label className="portal-field"><span>Product Serial No. *</span><input required value={form.serialNumber} onChange={(event) => updateForm('serialNumber', event.target.value)} /></label>
            <label className="portal-field"><span>IMEI {expectsImei ? '*' : ''}</span><input required={expectsImei} value={form.imeiNumber} onChange={(event) => updateForm('imeiNumber', event.target.value)} /></label>
            <label className="portal-field"><span>Warranty Status *</span><select value={form.warrantyStatus} onChange={(event) => updateForm('warrantyStatus', event.target.value)}><option value="IN_WARRANTY">In Warranty</option><option value="OUT_OF_WARRANTY">Out of Warranty</option><option value="EXTENDED_WARRANTY">Extended Warranty</option></select></label>
            <label className="portal-field"><span>Priority *</span><select value={form.priority} onChange={(event) => updateForm('priority', event.target.value as ClaimFormState['priority'])}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></label>
            <label className="portal-field"><span>Source Channel *</span><select value={form.sourceChannel} onChange={(event) => updateForm('sourceChannel', event.target.value)}><option value="PORTAL">Portal</option><option value="WEB">Web</option><option value="WHATSAPP">WhatsApp</option><option value="CALL_CENTER">Call Center</option></select></label>
            <label className="portal-field"><span>Promised SLA Hours</span><input type="number" min="1" value={form.promisedSlaHours} onChange={(event) => updateForm('promisedSlaHours', event.target.value)} /></label>
            <label className="portal-field portal-field-span-2"><span>Device Condition</span><input value={form.deviceCondition} onChange={(event) => updateForm('deviceCondition', event.target.value)} /></label>
            <label className="portal-field portal-field-span-2"><span>QR Payload</span><input value={form.qrCodePayload} onChange={(event) => updateForm('qrCodePayload', event.target.value)} /></label>
            <label className="portal-field portal-field-span-2"><span>Issue Summary *</span><input required value={form.issueSummary} onChange={(event) => updateForm('issueSummary', event.target.value)} /></label>
            <label className="portal-field portal-field-span-2"><span>Issue Description</span><textarea rows={4} value={form.issueDescription} onChange={(event) => updateForm('issueDescription', event.target.value)} /></label>
          </div>
        </div>

        <div className="portal-action-row">
          <button className="portal-button portal-button-search" disabled={submitting || loading} type="submit">{submitting ? 'Registering...' : 'Register Claim'}</button>
          <button className="portal-button portal-button-secondary" type="button" onClick={() => setForm(emptyForm)}>Reset Form</button>
          <Link className="secondary-button" to="/requests">Open Claims</Link>
        </div>
      </form>

      {createdRequest ? (
        <article className="card portal-panel">
          <div className="portal-section-header">
            <h3>Claim Registered</h3>
            <p>{createdRequest.requestNumber} has been stored in the portal and is now available in the live claims queue.</p>
          </div>
          <div className="portal-action-row">
            <Link className="secondary-button" to={`/requests/${createdRequest.id}`}>Open claim details</Link>
            <Link className="secondary-button" to="/requests">View claims queue</Link>
          </div>
        </article>
      ) : null}
    </section>
  );
}
