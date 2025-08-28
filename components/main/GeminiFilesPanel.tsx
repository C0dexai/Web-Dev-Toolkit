import React, { useState } from 'react';
import Button from '../ui/Button';
import { UploadIcon } from '../icons/UploadIcon';
import { TrashIcon } from '../icons/TrashIcon';
import { FileIcon } from '../icons/FileIcon';
import Spinner from '../ui/Spinner';

interface GeminiFilesPanelProps {
  threadId: string | null;
  files: File[];
  onAddFile: (threadId: string, file: File) => void;
  onRemoveFile: (threadId: string, fileName: string) => void;
}

const GeminiFilesPanel: React.FC<GeminiFilesPanelProps> = ({ threadId, files, onAddFile, onRemoveFile }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!threadId) {
      setError("Please select a thread before adding files.");
      return;
    }
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      Array.from(selectedFiles).forEach(file => {
        onAddFile(threadId, file);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add files.");
    } finally {
      setIsUploading(false);
      // Clear the file input
      (event.target as HTMLInputElement).value = '';
    }
  };

  const handleDeleteFile = (fileName: string) => {
    if (!threadId) return;
    onRemoveFile(threadId, fileName);
  };

  if (!threadId) {
    return (
      <div className="p-8 text-center text-text-secondary">
        <p>Select a thread to attach files for context.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold font-orbitron">Context Files (Gemini)</h2>
          <p className="text-text-secondary mt-1">Attach files to provide context for the current conversation.</p>
        </div>
        <Button onClick={() => document.getElementById('gemini-file-upload')?.click()} disabled={isUploading}>
          {isUploading ? <><Spinner /> Adding...</> : <><UploadIcon className="w-5 h-5"/> Add Files</>}
        </Button>
        <input type="file" id="gemini-file-upload" className="hidden" onChange={handleFileChange} multiple />
      </div>

      {error && <div className="p-4 mb-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}

      <div className="bg-black/20 rounded-lg border border-border">
        {files.length > 0 ? (
          <ul className="divide-y divide-border">
            {files.map(file => (
              <li key={file.name} className="p-4 flex justify-between items-center hover:bg-surface-hover/50">
                <div className="flex items-center gap-4 overflow-hidden">
                  <FileIcon className="w-6 h-6 text-text-secondary flex-shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-medium text-text-primary truncate" title={file.name}>{file.name}</p>
                    <p className="text-sm text-gray-400">{file.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <span className="text-sm text-gray-400">{(file.size / 1024).toFixed(2)} KB</span>
                  <button onClick={() => handleDeleteFile(file.name)} className="p-2 rounded-md hover:bg-red-500/20 text-gray-500 hover:text-red-400">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-text-secondary">
              No files attached to this thread. Add files to include them as context in your next message.
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiFilesPanel;
