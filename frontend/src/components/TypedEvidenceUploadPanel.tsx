import { useEffect, useMemo, useRef, useState } from 'react';
import type { AttachmentItem, UserRole } from '../types/models';

type EvidenceSectionId = 'pickup' | 'cashless-device' | 'cashless-damage';

type EvidenceSlot = {
  type: string;
  label: string;
  helper: string;
};

type EvidenceSection = {
  id: EvidenceSectionId;
  title: string;
  description: string;
  slots: EvidenceSlot[];
};

type EvidenceUploadPanelProps = {
  requestId: number;
  attachments: AttachmentItem[];
  onUpload: (attachmentType: string, file: File) => Promise<void>;
  onRemove: (attachmentId: number) => Promise<void>;
  mode?: 'standard' | 'runner';
  role?: UserRole | null;
};

const pickupSlots: EvidenceSlot[] = [
  { type: 'PICKUP_IMAGE_FRONT', label: 'Front View', helper: 'Capture the front display and body.' },
  { type: 'PICKUP_IMAGE_BACK', label: 'Back View', helper: 'Capture the back panel condition.' },
  { type: 'PICKUP_IMAGE_LEFT', label: 'Left Edge', helper: 'Capture the left side frame.' },
  { type: 'PICKUP_IMAGE_RIGHT', label: 'Right Edge', helper: 'Capture the right side frame.' },
  { type: 'PICKUP_IMAGE_TOP', label: 'Top Edge', helper: 'Capture ports and top-side condition.' },
  { type: 'PICKUP_IMAGE_BOTTOM', label: 'Bottom Edge', helper: 'Capture speakers, ports, and bottom frame.' },
];

const cashlessDeviceSlots: EvidenceSlot[] = [
  { type: 'CASHLESS_DEVICE_IMAGE_FRONT', label: 'Device Front', helper: 'Front body image for cashless review.' },
  { type: 'CASHLESS_DEVICE_IMAGE_BACK', label: 'Device Back', helper: 'Back body image for cashless review.' },
  { type: 'CASHLESS_DEVICE_IMAGE_LEFT', label: 'Device Left', helper: 'Left-side body image.' },
  { type: 'CASHLESS_DEVICE_IMAGE_RIGHT', label: 'Device Right', helper: 'Right-side body image.' },
  { type: 'CASHLESS_DEVICE_IMAGE_TOP', label: 'Device Top', helper: 'Top-side body image.' },
  { type: 'CASHLESS_DEVICE_IMAGE_BOTTOM', label: 'Device Bottom', helper: 'Bottom-side body image.' },
];

const cashlessDamageSlots: EvidenceSlot[] = [
  { type: 'CASHLESS_DAMAGE_IMAGE_1', label: 'Damage Close-up 1', helper: 'Primary damage close-up.' },
  { type: 'CASHLESS_DAMAGE_IMAGE_2', label: 'Damage Close-up 2', helper: 'Secondary damage close-up.' },
  { type: 'CASHLESS_DAMAGE_IMAGE_3', label: 'Damage Close-up 3', helper: 'Additional supporting evidence.' },
  { type: 'CASHLESS_DAMAGE_IMAGE_4', label: 'Damage Close-up 4', helper: 'Final required damage image.' },
];

const evidenceSections: EvidenceSection[] = [
  {
    id: 'pickup',
    title: 'Pickup Evidence',
    description: 'Collect the exact six-side evidence set before handoff from the customer.',
    slots: pickupSlots,
  },
  {
    id: 'cashless-device',
    title: 'Cashless Device Images',
    description: 'Upload the required six device-angle images for the cashless team.',
    slots: cashlessDeviceSlots,
  },
  {
    id: 'cashless-damage',
    title: 'Cashless Damage Images',
    description: 'Upload the four close-up damage images required for approval.',
    slots: cashlessDamageSlots,
  },
];

function getPreferredSectionId(attachments: AttachmentItem[], role?: UserRole | null): EvidenceSectionId {
  if (role === 'PICKUP_AGENT') {
    return 'pickup';
  }

  const attachmentTypes = new Set(attachments.map((attachment) => attachment.attachmentType));
  const nextIncomplete = evidenceSections.find((section) => section.slots.some((slot) => !attachmentTypes.has(slot.type)));
  return nextIncomplete?.id ?? 'pickup';
}

function countCompletedSlots(slots: EvidenceSlot[], attachmentByType: Map<string, AttachmentItem>) {
  return slots.filter((slot) => attachmentByType.has(slot.type)).length;
}

function EvidenceSectionCard({
  section,
  attachmentByType,
  uploadingType,
  removingId,
  onFileSelected,
  onRemove,
}: {
  section: EvidenceSection;
  attachmentByType: Map<string, AttachmentItem>;
  uploadingType: string | null;
  removingId: number | null;
  onFileSelected: (type: string, file: File) => void;
  onRemove: (attachment: AttachmentItem) => void;
}) {
  const nextRequiredType = section.slots.find((slot) => !attachmentByType.has(slot.type))?.type ?? null;

  return (
    <article className="card evidence-section">
      <div className="workspace-panel-head">
        <h3>{section.title}</h3>
        <p>{section.description}</p>
      </div>

      <div className="evidence-slot-grid">
        {section.slots.map((slot) => {
          const attachment = attachmentByType.get(slot.type);
          const complete = Boolean(attachment);
          const isNextRequired = !complete && nextRequiredType === slot.type;
          const busy = uploadingType === slot.type || removingId === attachment?.id;

          return (
            <label key={slot.type} className={`evidence-slot${complete ? ' complete' : ''}${isNextRequired ? ' next-required' : ''}`}>
              <div>
                <strong>{slot.label}</strong>
                <span>{slot.helper}</span>
              </div>

              <div className="evidence-slot-status-row">
                <span className={complete ? 'ok-badge' : isNextRequired ? 'alert-badge' : 'status-badge'}>
                  {complete ? 'Uploaded' : isNextRequired ? 'Next Required' : 'Pending'}
                </span>
                {attachment ? <small>{attachment.fileName}</small> : null}
              </div>

              {attachment ? (
                <div className="evidence-slot-actions">
                  <a className="secondary-button evidence-action" href={attachment.signedUrl} target="_blank" rel="noreferrer">
                    Preview
                  </a>
                  <button
                    type="button"
                    className="secondary-button danger-button evidence-action"
                    disabled={busy}
                    onClick={() => onRemove(attachment)}
                  >
                    {busy ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={busy}
                    capture="environment"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        onFileSelected(slot.type, file);
                        event.target.value = '';
                      }
                    }}
                  />
                  <small>{busy ? 'Uploading...' : 'Use camera or choose an image file.'}</small>
                </>
              )}
            </label>
          );
        })}
      </div>
    </article>
  );
}

export function TypedEvidenceUploadPanel({
  requestId,
  attachments,
  onUpload,
  onRemove,
  mode = 'standard',
  role,
}: EvidenceUploadPanelProps) {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const compactMode = mode === 'runner';

  const attachmentByType = useMemo(
    () => new Map(attachments.map((attachment) => [attachment.attachmentType, attachment])),
    [attachments],
  );

  const preferredSectionId = useMemo(
    () => getPreferredSectionId(attachments, role),
    [attachments, role],
  );

  const [activeSectionId, setActiveSectionId] = useState<EvidenceSectionId>(preferredSectionId);

  useEffect(() => {
    if (compactMode) {
      setActiveSectionId(preferredSectionId);
    }
  }, [compactMode, preferredSectionId]);

  function setTransientMessage(value: string) {
    setMessage(value);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    timerRef.current = window.setTimeout(() => setMessage(null), 2500);
  }

  async function handleUpload(attachmentType: string, file: File) {
    try {
      setUploadingType(attachmentType);
      await onUpload(attachmentType, file);
      setTransientMessage(`${attachmentType} uploaded successfully.`);
    } catch (error) {
      setTransientMessage(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploadingType(null);
    }
  }

  async function handleRemove(attachment: AttachmentItem) {
    try {
      setRemovingId(attachment.id);
      await onRemove(attachment.id);
      setTransientMessage(`${attachment.attachmentType} removed successfully.`);
    } catch (error) {
      setTransientMessage(error instanceof Error ? error.message : 'Remove failed');
    } finally {
      setRemovingId(null);
    }
  }

  const sectionsToRender = compactMode
    ? evidenceSections.filter((section) => section.id === activeSectionId)
    : evidenceSections;

  return (
    <section className={`workspace-page evidence-panel${compactMode ? ' runner-mode' : ''}`}>
      <div className="evidence-progress-strip">
        {evidenceSections.map((section) => {
          const completed = countCompletedSlots(section.slots, attachmentByType);
          const total = section.slots.length;
          const active = section.id === activeSectionId;
          const nextSlot = section.slots.find((slot) => !attachmentByType.has(slot.type));

          return (
            <button
              key={section.id}
              type="button"
              className={`evidence-progress-card${active ? ' active' : ''}`}
              onClick={() => setActiveSectionId(section.id)}
            >
              <strong>{section.title}</strong>
              <span>{completed}/{total} complete</span>
              <small>{nextSlot ? `Next: ${nextSlot.label}` : 'All required slots captured'}</small>
            </button>
          );
        })}
      </div>

      {sectionsToRender.map((section) => (
        <EvidenceSectionCard
          key={section.id}
          section={section}
          attachmentByType={attachmentByType}
          uploadingType={uploadingType}
          removingId={removingId}
          onFileSelected={handleUpload}
          onRemove={handleRemove}
        />
      ))}

      <div className="workspace-support-copy evidence-support-copy">
        <strong>Request #{requestId}</strong>
        <span>
          {message ?? (compactMode
            ? 'Runner mode keeps the next required capture step in focus for faster pickup completion on mobile.'
            : 'Preview, remove, and re-upload typed evidence directly against the live backend request.')}
        </span>
      </div>
    </section>
  );
}
