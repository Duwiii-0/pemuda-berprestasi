// UploadBuktiModal.tsx - SINGLE FILE VERSION

import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, AlertCircle, CheckCircle, Eye, Download, Trash2 } from 'lucide-react';
import AlertModal from '../components/alertModal'; // Sesuaikan path

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
  onUpload?: (file: File, dojangId: string) => Promise<void>;
  onDelete?: (fileId: string) => Promise<void>; // Tambah delete callback
  existingFiles?: ExistingBuktiFile[];
  totalPeserta: number;
}

const UploadBuktiModal: React.FC<UploadBuktiModalProps> = ({ 
  isOpen, 
  onClose, 
  kompetisiName,
  dojangId,
  dojangName,
  onUpload,
  onDelete,
  existingFiles = [],
  totalPeserta = 0
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [confirmedWA, setConfirmedWA] = useState(false);

  // hitung biaya
  const biayaPerPeserta = 500000;
  const totalBiaya = totalPeserta * biayaPerPeserta;

  // State untuk delete confirmation
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    fileId: string;
    fileName: string;
  }>({ isOpen: false, fileId: '', fileName: '' });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setUploadError('');
      setIsUploading(false);
      setDragActive(false);
      setDeleteModal({ isOpen: false, fileId: '', fileName: '' });
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    }
  }, [isOpen, previewUrl]);

  // Fungsi show delete confirmation
  const showDeleteConfirmation = (fileId: string, fileName: string) => {
    setDeleteModal({ isOpen: true, fileId, fileName });
  };

  // Fungsi handle confirm delete
  const handleConfirmDelete = async () => {
    const { fileId } = deleteModal;
    
    // Close modal
    setDeleteModal({ isOpen: false, fileId: '', fileName: '' });
    
    if (!fileId || !onDelete) return;

    // Set loading state
    setDeletingFiles(prev => new Set(prev).add(fileId));

    try {
      await onDelete(fileId);
      // File akan hilang dari list karena parent akan refresh existingFiles
    } catch (error) {
      console.error('Delete error:', error);
      setUploadError('Gagal menghapus file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      // Remove loading state
      setDeletingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
    }
  };

  // Fungsi close delete confirmation
  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, fileId: '', fileName: '' });
  };

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

    if (!confirmedWA) {
      setUploadError('Silahkan konfirmasi melalui WA terlebih dahulu');
      return;
    }
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
      // buat liat error "setUploadError(error instanceof Error ? error.message : 'Gagal mengupload file');"
      setUploadError('Gagal mengupload file, silahkan hubungi admin');
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

  // Import utility functions
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://cjvmanagementevent.com';

   const buktiTransferUrls = {
    // Preview/View URL - untuk menampilkan gambar
    getPreviewUrl: (filename: string): string => {
      return `${API_BASE_URL}/uploads/pelatih/BuktiTf/${filename}`;
    },

    // Download URL - untuk download file
    getDownloadUrl: (filename: string): string => {
      return `${API_BASE_URL}/uploads/pelatih/BuktiTf/${filename}`;
    }
  };

  //  individual functions for easier import
   const getBuktiTransferPreviewUrl = buktiTransferUrls.getPreviewUrl;
   const getBuktiTransferDownloadUrl = buktiTransferUrls.getDownloadUrl;

  const getExistingFileUrl = (filename: string): string => {
    return getBuktiTransferPreviewUrl(filename);
  };

  const handleDownloadExisting = async (file: ExistingBuktiFile): Promise<void> => {
    try {
      const downloadUrl = getBuktiTransferDownloadUrl(file.filePath);
      
      console.log('Downloading from:', downloadUrl);
      
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
                {existingFiles.map((file) => {
                  const isDeleting = deletingFiles.has(file.id);
                  
                  return (
                    <div key={file.id} className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.fileName}</p>
                      </div>
                      <div className="flex gap-2">
                        {/* View Button */}
                        <button
                          onClick={() => window.open(getExistingFileUrl(file.filePath), '_blank')}
                          className="p-1 text-blue-600 hover:text-blue-800 disabled:opacity-50"
                          title="Lihat file"
                          disabled={isDeleting}
                        >
                          <Eye size={16} />
                        </button>
                        
                        {/* Download Button */}
                        <button
                          onClick={() => handleDownloadExisting(file)}
                          className="p-1 text-green-600 hover:text-green-800 disabled:opacity-50"
                          title="Download file"
                          disabled={isDeleting}
                        >
                          <Download size={16} />
                        </button>
                        
                        {/* Delete Button */}
                        {onDelete && (
                          <button
                            onClick={() => showDeleteConfirmation(file.id, file.fileName)}
                            className={`p-1 transition-colors disabled:opacity-50 ${
                              isDeleting 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-red-600 hover:text-red-800 hover:bg-red-50 rounded'
                            }`}
                            title={isDeleting ? "Menghapus..." : "Hapus file"}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-red-700 mb-4">Biaya Pendaftaran</h3>
              <ul className="text-sm text-red-800 space-y-2">
                <li><span className="font-semibold">Rp 500.000 / Atlet</span></li>
                <li>Jumlah Peserta: <span className="font-semibold">{totalPeserta}</span> orang</li>
                <li>Total Biaya: <span className="font-semibold">Rp {totalBiaya.toLocaleString("id-ID")}</span></li>
              </ul>
              <div className="mt-4 text-sm text-gray-700">
                <p>Pembayaran melalui rekening:</p>
                <p className="font-semibold">BANK SUMSEL BABEL</p>
                <p className="font-semibold text-lg">19309010367</p>
                <p>a.n Panitia UKT Pengprov TISS</p>
              </div>
              <div className="mt-4 text-xs text-gray-600">
                <p>Keterangan Transfer: <span className="font-semibold">Nama Club_Total Peserta</span></p>
                <p>Pembayaran terakhir: <span className="font-semibold">08 November</span> atau bila kuota penuh.</p>
              </div>
              <div className="mt-4 text-md text-green-700 flex items-center gap-2">
                <span className="font-medium">Konfirmasi WA:</span>
                <span className="font-semibold "><a href='https://wa.me/6285378441489' className='underline font-bold'>0853-7844-1489</a> (Jeje)</span>
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
          <div className="">
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
        
        {/* Confirmation Checkbox */}
        <div className="mb-6 flex justify-start items-center gap-3 px-6">
          <input
            id="confirm-wa"
            type="checkbox"
            checked={confirmedWA}
            onChange={(e) => setConfirmedWA(e.target.checked)}
            className="mt-1 w-6 h-6 cursor-pointer"
          />
          <label htmlFor="confirm-wa" className="pt-1 text-md font-medium text-gray-800 cursor-pointer">
            Saya sudah konfirmasi pembayaran ke nomor WhatsApp panitia di atas.
          </label>
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
            disabled={!selectedFile || isUploading || !confirmedWA}
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
    
      <AlertModal
        isOpen={deleteModal.isOpen}
        message={`Apakah Anda yakin ingin menghapus file ini?`}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default UploadBuktiModal;