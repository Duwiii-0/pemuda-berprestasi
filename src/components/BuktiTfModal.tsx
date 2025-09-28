// UploadBuktiModal.tsx - SINGLE FILE VERSION

import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Eye, Download } from 'lucide-react';

interface ExistingBuktiFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  uploadDate: string;
}

interface UploadBuktiModalProps {
  isOpen: boolean;
  onClose: () => void;
  kompetisiName: string;
  dojangId: string;
  dojangName: string;
  onUpload?: (file: File, dojangId: string) => Promise<void>; // Single file
  existingFiles?: ExistingBuktiFile[];
}

const UploadBuktiModal: React.FC<UploadBuktiModalProps> = ({ 
  isOpen, 
  onClose, 
  kompetisiName,
  dojangId,
  dojangName,
  onUpload,
  existingFiles = []
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setUploadError('');
      setIsUploading(false);
      setDragActive(false);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, previewUrl]);

  const validateFile = (file: File): string | null => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Format file harus JPG, PNG, JPEG, atau WebP';
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Ukuran file maksimal 5MB';
    }

    return null;
  };

  const handleFileSelect = (file: File): void => {
    setUploadError('');
    
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    
    // Create preview URL for image
    if (file.type.startsWith('image/')) {
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } catch (error) {
        console.error('Error creating preview URL:', error);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]); // Only take first file
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    e.target.value = '';
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile || !onUpload) return;

    setIsUploading(true);
    setUploadError('');

    try {
      await onUpload(selectedFile, dojangId);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadError(error instanceof Error ? error.message : 'Gagal mengupload file');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileInputClick = (): void => {
    const fileInput = document.getElementById('bukti-file-input') as HTMLInputElement;
    fileInput?.click();
  };

  const getExistingFileUrl = (filename: string): string => {
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/bukti-transfer/files/${filename}`;
  };

  const handleDownloadExisting = async (file: ExistingBuktiFile): Promise<void> => {
    try {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/api/bukti-transfer/download/${file.filePath}`;
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error('Download error:', error);
      setUploadError('Gagal mendownload file');
    }
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="font-bebas text-2xl text-gray-900">Upload Bukti Transfer</h2>
            <p className="font-plex text-sm text-gray-600 mt-1">{kompetisiName}</p>
            <p className="font-plex text-xs text-blue-600 mt-1 font-semibold">
              Dojang: {dojangName} (ID: {dojangId})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            type="button"
            disabled={isUploading}
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Existing Files Display */}
          {existingFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Bukti Transfer yang Sudah Diupload</h3>
              <div className="space-y-3">
                {existingFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.fileSize)} • {file.uploadDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(getExistingFileUrl(file.filePath), '_blank')}
                        className="p-1 text-blue-600 hover:text-blue-800"
                        title="Lihat file"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDownloadExisting(file)}
                        className="p-1 text-green-600 hover:text-green-800"
                        title="Download file"
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Petunjuk Upload Bukti Transfer:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Format yang didukung: JPG, PNG, JPEG, WebP</li>
                    <li>• Maksimal ukuran file: 5MB</li>
                    <li>• Upload satu file bukti transfer</li>
                    <li>• Pastikan bukti transfer jelas dan terbaca</li>
                    <li>• Bukti transfer akan dikaitkan dengan Dojang: {dojangName}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Bukti Transfer <span className="text-red-500">*</span>
            </label>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-300 cursor-pointer ${
                dragActive 
                  ? 'border-yellow-400 bg-yellow-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleFileInputClick}
            >
              <input
                id="bukti-file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="text-center">
                {selectedFile ? (
                  // Show selected file
                  <div className="space-y-3">
                    {previewUrl && (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-32 h-32 object-cover rounded-lg mx-auto border border-gray-200"
                      />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }
                      }}
                    >
                      Ganti File
                    </button>
                  </div>
                ) : (
                  // Show upload area
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="p-3 bg-blue-100 rounded-full">
                        <Upload size={32} className="text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-lg">
                        {dragActive ? 'Lepas file di sini' : 'Pilih file atau drag & drop'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        JPG, PNG, JPEG atau WebP (max. 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-500" />
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload Notes */}
          <div className="mb-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-1">Catatan Penting:</p>
                  <p className="text-xs">
                    Bukti transfer akan dikaitkan dengan dojang Anda dan diverifikasi oleh admin. 
                    Status pembayaran akan diupdate setelah verifikasi selesai.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            {isUploading ? 'Uploading...' : 'Batal'}
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            type="button"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Mengupload...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadBuktiModal;