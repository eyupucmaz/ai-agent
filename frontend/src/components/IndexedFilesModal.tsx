import { useState } from 'react';

interface IndexedFile {
  path: string;
  lastModified: string;
  description: string;
}

interface IndexedFilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  repoName: string;
  files: IndexedFile[];
}

export default function IndexedFilesModal({
  isOpen,
  onClose,
  repoName,
  files,
}: IndexedFilesModalProps) {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-space_cadet-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-space_cadet-100 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col shadow-2xl border border-space_cadet-300">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-fairy_tale-200">
            {repoName} - Indexed Files
          </h2>
          <button
            onClick={onClose}
            className="text-fairy_tale-400 hover:text-fairy_tale-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {files.length === 0 ? (
            <p className="text-fairy_tale-400 text-center py-4">
              No indexed files yet.
            </p>
          ) : (
            <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="bg-space_cadet-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full flex items-center justify-between p-3 hover:bg-space_cadet-300 transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-iris-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span className="text-sm font-medium text-fairy_tale-200">
                        {file.path}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-xs text-fairy_tale-400">
                        {new Date(file.lastModified).toLocaleString('en-US')}
                      </span>
                      <svg
                        className={`w-4 h-4 text-fairy_tale-400 transition-transform ${
                          openItems.includes(index)
                            ? 'transform rotate-180'
                            : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </button>
                  {openItems.includes(index) && (
                    <div className="p-3 border-t border-space_cadet-300 bg-space_cadet-250">
                      <p className="text-sm text-fairy_tale-300">
                        {file.description || 'No description available'}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
