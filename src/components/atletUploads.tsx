// src/components/atletUploads.tsx
import { useState, useEffect } from "react";
import type { ChangeEvent } from "react";
import { X, Eye, Download, Upload, IdCard, User, Award, CreditCard } from 'lucide-react';
import toast from "react-hot-toast";

// Interface untuk AtletWithFiles - harus match dengan yang di Profile
interface AtletWithFiles {
  id_atlet: number;
  nama_atlet: string;
  jenis_kelamin: "LAKI_LAKI" | "PEREMPUAN";
  tanggal_lahir: string;
  berat_badan?: number;
  tinggi_badan?: number;
  belt?: string;
  alamat?: string;
  provinsi?: string;
  no_telp?: string;
  nik?: string;
  umur?: number;
  
  // File objects untuk upload (temporary)
  akte_kelahiran?: File | null;
  pas_foto?: File | null;
  sertifikat_belt?: File | null;
  ktp?: File | null;
  
  // Path fields untuk existing files (dari database)
  akte_kelahiran_path?: string;
  pas_foto_path?: string;
  sertifikat_belt_path?: string;
  ktp_path?: string;
  
  // Tambahan field kota
  kota?: string;
}

interface FilePreviewProps {
  file: File | null;
  existingPath?: string;
  onRemove: () => void;
  disabled: boolean;
  label: string;
  onFileChange: (file: File | null) => void;
  accept?: string;
  fileInputId?: string;
}

const AtletFilePreview: React.FC<FilePreviewProps> = ({ 
  file, 
  existingPath, 
  onRemove, 
  disabled,
  label,
  onFileChange,
  accept = "image/*",
  fileInputId
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        setPreviewError(false);
        return () => URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error creating preview URL:', error);
        setPreviewError(true);
      }
    } else {
      setPreviewUrl(null);
      setPreviewError(false);
    }
  }, [file]);

  // Handle file selection dengan validasi image
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target?.files?.[0];
    if (selectedFile) {
      // Validasi ukuran file (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      // Validasi tipe file - HANYA IMAGE
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Format file harus JPG, PNG, JPEG, atau WebP");
        return;
      }

      onFileChange(selectedFile);
      toast.success(`${label} berhasil dipilih`);
    }
  };

  // Handle file removal
  const handleRemove = () => {
    onRemove();
    
    // Reset file input
    const fileInput = document.getElementById(fileInputId || '') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
    
    toast.success(`${label} berhasil dihapus`);
  };

  // Get display filename
  const getDisplayFileName = () => {
    if (file) return file.name;
    if (existingPath) {
      const fileName = existingPath.split('/').pop() || label;
      return fileName.length > 50 ? `${label} (File tersimpan)` : fileName;
    }
    return label;
  };

  // Handle download
  const handleDownload = async () => {
    if (!existingPath) {
      toast.error('Tidak ada file untuk didownload');
      return;
    }
    
    try {
      const baseUrl = 'https://pemudaberprestasi.com';
      
      // Handle both old format (with subfolder) and new format (filename only)
      let downloadUrl;
      
      if (existingPath.includes('/')) {
        // Old format: "subfolder/filename.jpg"
        downloadUrl = `${baseUrl}/uploads/atlet/${existingPath}`;
      } else {
        // New format: "filename.jpg" - need to add subfolder based on label
        const folderMap: Record<string, string> = {
          'Akte Kelahiran': 'akte_kelahiran',
          'Pas Foto': 'pas_foto',
          'Sertifikat Belt': 'sertifikat_belt',
          'KTP': 'ktp'
        };
        const subfolder = folderMap[label] || 'documents';
        downloadUrl = `${baseUrl}/uploads/atlet/${subfolder}/${existingPath}`;
      }
      
      console.log(`📥 Downloading from: ${downloadUrl}`);
      
      const testResponse = await fetch(downloadUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        toast.error('File tidak ditemukan di server');
        return;
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = getDisplayFileName();
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Download ${label} berhasil!`);
      
    } catch (error) {
      console.error('❌ Download error:', error);
      toast.error('Gagal mendownload file');
    }
  };

  // Get preview URL
  const getPreviewUrl = () => {
    if (file && previewUrl) return previewUrl;
    
    if (existingPath) {
      const baseUrl = 'https://pemudaberprestasi.com';
      
      // Handle both old format (with subfolder) and new format (filename only)
      let staticUrl;
      
      if (existingPath.includes('/')) {
        // Old format: "subfolder/filename.jpg"
        staticUrl = `${baseUrl}/uploads/atlet/${existingPath}`;
      } else {
        // New format: "filename.jpg" - need to add subfolder based on label
        const folderMap: Record<string, string> = {
          'Akte Kelahiran': 'akte_kelahiran',
          'Pas Foto': 'pas_foto', 
          'Sertifikat Belt': 'sertifikat_belt',
          'KTP': 'ktp'
        };
        const subfolder = folderMap[label] || 'documents';
        staticUrl = `${baseUrl}/uploads/atlet/${subfolder}/${existingPath}`;
      }
      
      console.log("🌐 Preview URL:", staticUrl);
      return staticUrl;
    }
    
    return null;
  };

  // Check if file is image (always true since we only accept images)
  const isImageFile = () => {
    if (file) return file.type.startsWith('image/');
    if (existingPath) {
      const ext = existingPath.toLowerCase().split('.').pop();
      return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
    }
    return false;
  };

  // Get icon based on document type
  const getDocumentIcon = () => {
    switch (label) {
      case 'KTP': return <CreditCard size={24} className="text-gray-400" />;
      case 'Pas Foto': return <User size={24} className="text-gray-400" />;
      case 'Sertifikat Belt': return <Award size={24} className="text-gray-400" />;
      case 'Akte Kelahiran': return <IdCard size={24} className="text-gray-400" />;
      default: return <Upload size={24} className="text-gray-400" />;
    }
  };

  const hasFile = file || existingPath;
  const displayUrl = getPreviewUrl();
  const fileName = getDisplayFileName();

  return (
    <div className="space-y-3">
      {/* File Input */}
      <div className="space-y-2">
        <div className="relative">
          <input
            id={fileInputId}
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="w-full p-3 border-2 border-red/20 hover:border-red/40 focus:border-red rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-plex file:bg-red/10 file:text-red hover:file:bg-red/20 text-sm lg:text-base"
            disabled={disabled}
          />
          {disabled && <div className="absolute inset-0 bg-gray-100/50 rounded-xl" />}
        </div>
      </div>

      {/* File Preview */}
      {hasFile && (
        <div className="p-3 bg-white/70 rounded-xl border border-red/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-black/70">
              {file ? `File baru: ${fileName}` : fileName}
            </span>
            {!disabled && (
              <button
                onClick={handleRemove}
                className="p-1 hover:bg-red/10 rounded-full transition-colors"
                type="button"
              >
                <X size={16} className="text-red" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            {/* Preview Image */}
            {displayUrl && !previewError && isImageFile() && (
              <div className="relative w-20 h-20 flex-shrink-0">
                <img 
                  src={displayUrl} 
                  alt={`Preview ${label}`}
                  className="w-full h-full object-cover rounded-lg border border-gray-200"
                  onError={(e) => {
                    console.log(`❌ Preview failed for: ${displayUrl}`);
                    setPreviewError(true);
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            {/* File icon untuk jika preview error */}
            {(!displayUrl || previewError || !isImageFile()) && (
              <div className="flex items-center gap-2 text-sm text-gray-600 w-20 h-20 border rounded-lg justify-center bg-gray-50">
                {getDocumentIcon()}
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-1 flex-1">
              {/* View/Preview Button */}
              {displayUrl && (
                <button
                  onClick={() => {
                    console.log(`🔍 Opening preview: ${displayUrl}`);
                    window.open(displayUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-600 rounded transition-colors"
                  type="button"
                >
                  <Eye size={12} />
                  Lihat Gambar
                </button>
              )}
              
              {/* Download button */}
              {existingPath && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-600 rounded transition-colors"
                  type="button"
                >
                  <Download size={12} />
                  Download
                </button>
              )}
              
              {/* Status indicator */}
              <div className="text-xs text-gray-500">
                {file ? '📎 File baru' : existingPath ? '💾 File tersimpan' : 'Tidak ada file'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Komponen utama untuk upload dokumen atlet (Images Only)
interface AtletDocumentUploaderProps {
  formData: AtletWithFiles;
  isEditing: boolean;
  onFileChange: (field: keyof AtletWithFiles, file: File | null) => void;
  onFileRemove: (field: keyof AtletWithFiles) => void;
}

export const AtletDocumentUploader: React.FC<AtletDocumentUploaderProps> = ({
  formData,
  isEditing,
  onFileChange,
  onFileRemove
}) => {
  const documentFields = [
    {
      key: 'akte_kelahiran' as keyof AtletWithFiles,
      label: 'Akte Kelahiran',
      accept: 'image/*',
      required: false,
      description: 'Upload foto akte kelahiran yang jelas'
    },
    {
      key: 'pas_foto' as keyof AtletWithFiles, 
      label: 'Pas Foto',
      accept: 'image/*',
      required: true,
      description: 'Pas foto 3x4 dengan latar belakang merah/biru'
    },
    {
      key: 'sertifikat_belt' as keyof AtletWithFiles,
      label: 'Sertifikat Belt', 
      accept: 'image/*',
      required: false,
      description: 'Foto sertifikat sabuk yang dimiliki'
    },
    {
      key: 'ktp' as keyof AtletWithFiles,
      label: 'KK',
      accept: 'image/*',
      required: false,
      description: 'Foto KK/KTP (wajib untuk atlet 17+ tahun)'
    }
  ];

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-xl border-2 border-gray-200">
      <div className="flex items-center gap-3 mb-4 lg:mb-6">
        <div className="p-2 bg-red/10 rounded-xl">
          <IdCard className="text-red" size={18} />
        </div>
        <h3 className="font-bebas text-xl lg:text-2xl text-black/80 tracking-wide">
          DOKUMEN PENDUKUNG
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {documentFields.map((doc) => (
          <div key={doc.key} className="space-y-2">
            <label className="block font-plex font-medium text-black/70 text-sm lg:text-base">
              {doc.label} {doc.required && <span className="text-red">*</span>}
            </label>
            <p className="text-xs text-gray-500 mb-2">{doc.description}</p>
            <AtletFilePreview
              file={(formData[doc.key] instanceof File ? formData[doc.key] : null) as File | null}
              existingPath={formData[`${doc.key}_path` as keyof AtletWithFiles] as string}
              onRemove={() => onFileRemove(doc.key)}
              disabled={!isEditing}
              label={doc.label}
              onFileChange={(file) => onFileChange(doc.key, file)}
              accept={doc.accept}
              fileInputId={`${String(doc.key)}-upload`}
            />
          </div>
        ))}
      </div>

      {/* Upload Tips */}
      {isEditing && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <h4 className="font-plex font-semibold text-blue-800 mb-2">Tips Upload Dokumen:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Format yang didukung: JPG, PNG, JPEG, WebP (hanya gambar)</li>
            <li>• Ukuran maksimal per file: 5MB</li>
            <li>• Pastikan dokumen terlihat jelas dan tidak buram</li>
            <li>• Gunakan pencahayaan yang baik saat memfoto dokumen</li>
            <li>• Pas foto harus dengan latar belakang polos (merah/biru)</li>
            <li>• KTP wajib untuk atlet berusia 17 tahun ke atas</li>
            <li>• File baru akan menggantikan file yang sudah ada</li>
          </ul>
        </div>
      )}
    </div>
  );
};