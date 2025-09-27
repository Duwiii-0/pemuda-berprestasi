import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Trash2, Plus, Eye, Download } from 'lucide-react';

interface BuktiTfFile {
  id: string;
  file: File;
  uploadStatus: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
  previewUrl?: string;
}

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
  onUpload?: (files: File[], dojangId: string) => Promise<void>;
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
  const [buktiFiles, setBuktiFiles] = useState<BuktiTfFile[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setBuktiFiles([]);
      setUploadError('');
      setIsUploading(false);
      setDragActive(false);
    }
  }, [isOpen]);

  const validateFile = (file: File): string | null => {
    // Validate file type - Support images and PDF
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return 'Format file harus JPG, PNG, WebP, atau PDF';
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Ukuran file maksimal 5MB';
    }

    // Check for duplicate files
    const isDuplicate = buktiFiles.some(buktiFile => 
      buktiFile.file.name === file.name && buktiFile.file.size === file.size
    );
    if (isDuplicate) {
      return 'File dengan nama yang sama sudah dipilih';
    }

    return null;
  };

  const createPreviewUrl = (file: File): string | undefined => {
    if (file.type.startsWith('image/')) {
      try {
        return URL.createObjectURL(file);
      } catch (error) {
        console.error('Error creating preview URL:', error);
        return undefined;
      }
    }
    return undefined;
  };

  const addFiles = (files: FileList | File[]): void => {
    setUploadError('');
    const fileArray = Array.from(files);
    const newBuktiFiles: BuktiTfFile[] = [];

    fileArray.forEach(file => {
      const validationError = validateFile(file);
      const previewUrl = createPreviewUrl(file);
      
      const buktiFile: BuktiTfFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        uploadStatus: validationError ? 'error' : 'pending',
        errorMessage: validationError || undefined,
        previewUrl
      };

      newBuktiFiles.push(buktiFile);
    });

    setBuktiFiles(prev => [...prev, ...newBuktiFiles]);

    // Show general error if any files failed validation
    const hasErrors = newBuktiFiles.some(f => f.uploadStatus === 'error');
    if (hasErrors) {
      setUploadError('Beberapa file tidak dapat ditambahkan. Periksa detail di bawah.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      addFiles(files);
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
      addFiles(files);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const removeFile = (fileId: string): void => {
    setBuktiFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(f => f.id !== fileId);
    });
    setUploadError('');
  };

  const retryFile = (fileId: string): void => {
    setBuktiFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        const validationError = validateFile(f.file);
        return {
          ...f,
          uploadStatus: validationError ? 'error' : 'pending',
          errorMessage: validationError || undefined
        };
      }
      return f;
    }));
  };

  const handleUpload = async (): Promise<void> => {
    const validFiles = buktiFiles.filter(f => f.uploadStatus === 'pending');
    if (validFiles.length === 0) return;

    setIsUploading(true);
    setUploadError('');

    try {
      // Update status to uploading
      setBuktiFiles(prev => prev.map(f => 
        f.uploadStatus === 'pending' ? { ...f, uploadStatus: 'uploading' } : f
      ));

      // Extract files for upload
      const filesToUpload = validFiles.map(f => f.file);

      // Call the onUpload callback with files and dojang ID
      if (!onUpload) {
        setUploadError('Upload function tidak tersedia');
        return;
      }
      // ... kemudian:
      await onUpload(filesToUpload, dojangId);


      // Update status to success
      setBuktiFiles(prev => prev.map(f => 
        f.uploadStatus === 'uploading' ? { ...f, uploadStatus: 'success' } : f
      ));

      // Close modal after a short delay to show success state
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      // Update status to error
      setBuktiFiles(prev => prev.map(f => 
        f.uploadStatus === 'uploading' ? { 
          ...f, 
          uploadStatus: 'error',
          errorMessage: 'Gagal mengupload file'
        } : f
      ));
      setUploadError('Gagal mengupload beberapa file. Silakan coba lagi.');
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

  const getStatusIcon = (status: BuktiTfFile['uploadStatus']) => {
    switch (status) {
      case 'pending':
        return <FileText size={20} className="text-blue-500" />;
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success':
        return <CheckCircle size={20} className="text-green-500" />;
      case 'error':
        return <AlertCircle size={20} className="text-red-500" />;
    }
  };

  const isImageFile = (file: File): boolean => {
    return file.type.startsWith('image/');
  };

  const getExistingFileUrl = (filePath: string): string => {
    const baseUrl = 'https://cjvmanagementevent.com';
    // Assuming bukti transfer files are stored in a specific folder
    return `${baseUrl}/uploads/bukti_transfer/${filePath}`;
  };

  const handleDownloadExisting = async (file: ExistingBuktiFile): Promise<void> => {
    try {
      const downloadUrl = getExistingFileUrl(file.filePath);
      
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

  const pendingFilesCount = buktiFiles.filter(f => f.uploadStatus === 'pending').length;
  const hasValidFiles = pendingFilesCount > 0;

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      buktiFiles.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, [buktiFiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    <li>• Format yang didukung: JPG, PNG, WebP, PDF</li>
                    <li>• Maksimal ukuran file: 5MB per file</li>
                    <li>• Anda dapat mengupload multiple files sekaligus</li>
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
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={handleFileInputChange}
                multiple
                className="hidden"
              />
              
              <div className="text-center">
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
                    <p className="text-sm text-gray-500 mt-1">
                      Anda dapat memilih multiple file sekaligus
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      JPG, PNG, WebP atau PDF (max. 5MB per file)
                    </p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFileInputClick();
                    }}
                  >
                    <Plus size={16} />
                    Tambah File
                  </button>
                </div>
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

          {/* File List */}
          {buktiFiles.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">File yang Dipilih ({buktiFiles.length})</h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {buktiFiles.map((buktiFile) => (
                  <div
                    key={buktiFile.id}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                      buktiFile.uploadStatus === 'error'
                        ? 'bg-red-50 border-red-200'
                        : buktiFile.uploadStatus === 'success'
                        ? 'bg-green-50 border-green-200'
                        : buktiFile.uploadStatus === 'uploading'
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    {/* Preview or Icon */}
                    <div className="flex-shrink-0">
                      {buktiFile.previewUrl && isImageFile(buktiFile.file) ? (
                        <img
                          src={buktiFile.previewUrl}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <FileText size={20} className="text-gray-500" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {buktiFile.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(buktiFile.file.size)} • {buktiFile.file.type}
                      </p>
                      {buktiFile.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">{buktiFile.errorMessage}</p>
                      )}
                    </div>

                    {/* Status and Actions */}
                    <div className="flex items-center gap-2">
                      {getStatusIcon(buktiFile.uploadStatus)}
                      
                      {buktiFile.uploadStatus === 'error' && (
                        <button
                          onClick={() => retryFile(buktiFile.id)}
                          className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                        >
                          Retry
                        </button>
                      )}
                      
                      {(buktiFile.uploadStatus === 'pending' || buktiFile.uploadStatus === 'error') && (
                        <button
                          onClick={() => removeFile(buktiFile.id)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                          disabled={isUploading}
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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
            disabled={!hasValidFiles || isUploading}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            type="button"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Mengupload {buktiFiles.filter(f => f.uploadStatus === 'uploading').length} file...
              </>
            ) : (
              <>
                <Upload size={18} />
                Upload {pendingFilesCount} File
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadBuktiModal;