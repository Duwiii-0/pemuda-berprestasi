import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

interface AlertModalProps {
isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    message: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    message
}) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="bg-white rounded-xl p-6 w-[90%] max-w-sm text-center shadow-lg">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center rounded-full bg-gray-200 text-red">
                    <AlertCircle className="w-10 h-10" />
                </div>

                <p className="text-gray-800 text-lg font-medium">{message}</p>

                <div className="mt-6 flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition cursor-pointer font-inter">
                    Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-8 py-2 bg-red text-white rounded-md hover:bg-red-700 transition cursor-pointer font-inter">
                    Ok
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AlertModal;
