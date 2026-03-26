import { useState } from 'react';

export function FileUpload() {
  const [fileName, setFileName] = useState('');

  return (
    <label className="file-upload">
      <span>{fileName || 'Upload diagnostic or pickup file'}</span>
      <input
        type="file"
        onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
      />
    </label>
  );
}
