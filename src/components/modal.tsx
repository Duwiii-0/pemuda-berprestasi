import type { ReactNode } from "react";

type ModalProps = {
  children: ReactNode;
  isOpen: boolean;
};

const Modal = ({ children, isOpen }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* background hitam transparan */}
      <div className="absolute inset-0 bg-black/50 pointer-events-none"></div>

      {/* isi modal */}
      <div className="relative z-10  rounded-2xl shadow-lg p-6">
        {children}
      </div>
    </div>
  );
};

export default Modal;
