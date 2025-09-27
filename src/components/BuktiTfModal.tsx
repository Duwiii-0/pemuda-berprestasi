import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadBuktiModalProps {
  isOpen: boolean;
  onClose: () => void;
  kompetisiName: string;
  onUpload?: (file: File) => Promise<void>;
}

const UploadBuktiModal: React.FC<UploadBuktiModalProps> = ({ 
  isOpen, 
  onClose, 
  kompetisiName, 
  onUpload 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setUploadError('');
      setIsUploading(false);
      setDragActive(false);
    }
  }, [isOpen]);

  const handleFileSelect = (file: File): void => {
    setUploadError('');
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Format file tidak didukung. Gunakan JPG, PNG, atau PDF.');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setUploadError('Ukuran file maksimal 5MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
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
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async (): Promise<void> => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError('');

    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Call the onUpload callback with file data
      if (onUpload) {
        await onUpload(selectedFile);
      }
      
      // Close modal on success
      onClose();
    } catch (error) {
      setUploadError('Gagal mengupload file. Silakan coba lagi.');
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
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  };

  const handleRemoveFile = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    setSelectedFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="font-bebas text-2xl text-gray-900">Upload Bukti Pendaftaran</h2>
            <p className="font-plex text-sm text-gray-600 mt-1">
              {kompetisiName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            type="button"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={20} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Petunjuk Upload:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Format yang didukung: JPG, PNG, PDF</li>
                    <li>• Maksimal ukuran file: 5MB</li>
                    <li>• Pastikan bukti pembayaran jelas dan terbaca</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Bukti Pembayaran <span className="text-red-500">*</span>
            </label>
            
            <div
              className={`relative border-2 border-dashed rounded-xl p-6 transition-all duration-300 cursor-pointer ${
                dragActive 
                  ? 'border-yellow-400 bg-yellow-50' 
                  : selectedFile
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleFileInputClick}
            >
              <input
                id="file-input"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              <div className="text-center">
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle size={32} className="mx-auto text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">{selectedFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-sm text-red-600 hover:text-red-700 underline"
                    >
                      Hapus file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload size={32} className="mx-auto text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {dragActive ? 'Lepas file di sini' : 'Pilih file atau drag & drop'}
                      </p>
                      <p className="text-sm text-gray-500">JPG, PNG atau PDF (max. 5MB)</p>
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
                    Bukti pembayaran akan diverifikasi oleh admin. Status pendaftaran akan diupdate setelah verifikasi selesai.
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
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            type="button"
          >
            Batal
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                Upload Bukti
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadBuktiModal;