import React, { useContext, useRef, useState } from "react";
import { ChatContext } from "@/context/ChatContext";

// Local file type before upload
interface UploadFile {
  uid: string;
  name: string;
  type: string;
  size: number;
  originFileObj: File;
}

// Props for file metadata insertion into messages
interface InsertFileMetadata {
  fileId: string;
  path: string;
  mimeType: string;
  size: number;
  owner: string;
}

interface UploadFilePopupProps {
  isOpen: boolean;
  onClose: () => void;
  insertFileToken: (filename: string, metadata: InsertFileMetadata) => void;
}

// Response type from backend after upload
interface UploadedFileResponse {
  id: string;
  filename: string;
  file_path: string;
  mime_type: string;
  file_size: number;
  user_id: string;
}

// interface FileUploadResponse {
//   status: number;
//   msg: string;
//   data: UploadedFileResponse[];
// }

// export type FileUploadResponse<T = unknown> = {
//   status: number;
//   msg: string;
//   data: T[];
// };

const UploadFilePopup: React.FC<UploadFilePopupProps> = ({
  isOpen,
  onClose,
  insertFileToken,
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { FileUpload } = useContext(ChatContext);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const maxSize = 2 * 1024 * 1024; // 2MB
    const newFiles: UploadFile[] = [];

    Array.from(selectedFiles).forEach((file) => {
      if (file.size <= maxSize) {
        const uid = Math.random().toString(36).substring(2, 15);
        newFiles.push({
          uid,
          name: file.name,
          type: file.type,
          size: file.size,
          originFileObj: file,
        });
      } else {
        console.warn(`File ${file.name} exceeds size limit (2MB). Skipped.`);
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileToRemove: UploadFile) => {
    setFiles((prev) => prev.filter((file) => file.uid !== fileToRemove.uid));
  };

  const onSubmit = async () => {
    if (files.length === 0) return;

    setLoading(true);
    try {
      const data = new FormData();
      files.forEach((file) => {
        data.append("file", file.originFileObj);
      });

      const fileresponse = await FileUpload(data);

      if (fileresponse?.status === 1 && Array.isArray(fileresponse.data)) {
        for (const file of fileresponse.data as UploadedFileResponse[]) {
          // delay to mimic token insertion smoothness
          await new Promise((resolve) => setTimeout(resolve, 50));

          insertFileToken(file.filename, {
            fileId: file.id,
            path: file.file_path,
            mimeType: file.mime_type,
            size: file.file_size,
            owner: file.user_id,
          });
        }
        setFiles([]);
        onClose();
      } else {
        console.error("File upload failed:", fileresponse?.msg);
      }
    } catch (err) {
      console.error("Unexpected error while uploading files:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">Upload Files</h2>
        <input
          type="file"
          ref={fileInputRef}
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={handleButtonClick}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Select Files
        </button>

        <ul className="my-4 space-y-2 max-h-40 overflow-auto">
          {files.map((file) => (
            <li
              key={file.uid}
              className="flex justify-between items-center bg-gray-100 px-3 py-1 rounded"
            >
              <span>{file.name}</span>
              <button
                onClick={() => removeFile(file)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadFilePopup;
