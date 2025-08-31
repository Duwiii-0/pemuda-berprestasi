// src/components/SelectTeamMemberModal.tsx
import React, { useState } from "react";
import type { Atlet } from "../context/AtlitContext";
import { X } from "lucide-react";
import { GeneralButton } from "../pages/dashboard/dataDojang";

type Props = {
  isOpen: boolean;
  anggotaTim: Atlet[];
  onClose: () => void;
  onSelect: (atlet: Atlet) => void;
};

const SelectTeamMemberModal: React.FC<Props> = ({ isOpen, anggotaTim, onClose, onSelect }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-96 p-6 relative border border-gray-100">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition-colors"
          onClick={onClose}
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold mb-5 text-gray-900">Pilih Anggota Tim</h2>

        {/* List Anggota Tim */}
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
          {anggotaTim.map((a) => (
            <label
              key={a.id_atlet}
              className={`cursor-pointer flex items-center justify-between p-3 rounded-lg border transition-all duration-200
                ${selectedId === a.id_atlet ? "bg-blue-50 border-blue-400 shadow-inner" : "bg-gray-50 border-gray-200 hover:bg-gray-100"}
              `}
            >
              <span className="text-gray-800 font-medium">{a.nama_atlet}</span>
              <input
                type="radio"
                name="selectedAtlet"
                value={a.id_atlet}
                checked={selectedId === a.id_atlet}
                onChange={() => setSelectedId(a.id_atlet)}
                className="accent-blue-500 w-5 h-5"
              />
            </label>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <GeneralButton
            label="Batal"
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-4 py-2 rounded-lg transition-colors"
            onClick={onClose}
          />
          <GeneralButton
            label="Pilih"
            className="bg-red text-white hover:bg-yellow px-4 py-2 rounded-lg transition-colors"
            onClick={() => {
              const atlet = anggotaTim.find((a) => a.id_atlet === selectedId);
              if (atlet) {
                onSelect(atlet);
                onClose();
              }
            }}
            disabled={selectedId === null}
          />
        </div>
      </div>
    </div>
  );
};

export default SelectTeamMemberModal;
