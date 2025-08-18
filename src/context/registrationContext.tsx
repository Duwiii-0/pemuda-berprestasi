// src/context/registrationContext.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface RegistrationData {
  id: string;
  atlitId: number;
  atlitName: string;
  kompetisiId: number;
  kompetisiName: string;
  styleType: "kyorugi" | "poomsae";
  categoryType: "prestasi" | "pemula";
  gender: "Laki-Laki" | "Perempuan";
  ageCategory?: string;
  weightCategory?: string;
  registrationDate: string;
  status: "registered" | "confirmed" | "cancelled";
  biayaPendaftaran: number;
}

interface RegistrationContextType {
  registrations: RegistrationData[];
  addRegistration: (registration: Omit<RegistrationData, 'id' | 'registrationDate' | 'status'>) => void;
  cancelRegistration: (registrationId: string) => void;
  confirmRegistration: (registrationId: string) => void;
  getRegistrationsByKompetisi: (kompetisiId: number) => RegistrationData[];
  getRegistrationsByAtlit: (atlitId: number) => RegistrationData[];
  updateKompetisiParticipants: (kompetisiId: number) => number;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
};

interface RegistrationProviderProps {
  children: ReactNode;
}

export const RegistrationProvider = ({ children }: RegistrationProviderProps) => {
  // Dummy initial data untuk demo
  const [registrations, setRegistrations] = useState<RegistrationData[]>([
    {
      id: "reg-1",
      atlitId: 1,
      atlitName: "Rizky Purnama",
      kompetisiId: 1,
      kompetisiName: "Kejuaraan Karate Nasional 2024",
      styleType: "kyorugi",
      categoryType: "prestasi",
      gender: "Laki-Laki",
      ageCategory: "Senior",
      weightCategory: "-74",
      registrationDate: "2024-11-15",
      status: "registered",
      biayaPendaftaran: 150000
    },
    {
      id: "reg-2",
      atlitId: 2,
      atlitName: "Aulia",
      kompetisiId: 1,
      kompetisiName: "Kejuaraan Karate Nasional 2024",
      styleType: "poomsae",
      categoryType: "prestasi",
      gender: "Perempuan",
      ageCategory: "Junior",
      registrationDate: "2024-11-16",
      status: "registered",
      biayaPendaftaran: 150000
    },
    {
      id: "reg-3",
      atlitId: 3,
      atlitName: "Andi",
      kompetisiId: 1,
      kompetisiName: "Kejuaraan Karate Nasional 2024",
      styleType: "kyorugi",
      categoryType: "pemula",
      gender: "Laki-Laki",
      registrationDate: "2024-11-17",
      status: "registered",
      biayaPendaftaran: 150000
    }
  ]);

  const generateId = () => `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addRegistration = (registrationData: Omit<RegistrationData, 'id' | 'registrationDate' | 'status'>) => {
    // Check if athlete is already registered for this competition
    const existingRegistration = registrations.find(
      reg => reg.atlitId === registrationData.atlitId && 
             reg.kompetisiId === registrationData.kompetisiId &&
             reg.status !== 'cancelled'
    );

    if (existingRegistration) {
      toast.error('Atlet sudah terdaftar untuk kompetisi ini!');
      return;
    }

    const newRegistration: RegistrationData = {
      ...registrationData,
      id: generateId(),
      registrationDate: new Date().toISOString().split('T')[0],
      status: "registered"
    };

    setRegistrations(prev => [...prev, newRegistration]);
    toast.success(`${registrationData.atlitName} berhasil didaftarkan untuk ${registrationData.kompetisiName}!`);
  };

  const cancelRegistration = (registrationId: string) => {
    setRegistrations(prev =>
      prev.map(reg =>
        reg.id === registrationId
          ? { ...reg, status: "cancelled" as const }
          : reg
      )
    );
    toast.success('Registrasi berhasil dibatalkan!');
  };

  const confirmRegistration = (registrationId: string) => {
    setRegistrations(prev =>
      prev.map(reg =>
        reg.id === registrationId
          ? { ...reg, status: "confirmed" as const }
          : reg
      )
    );
    toast.success('Registrasi berhasil dikonfirmasi!');
  };

  const getRegistrationsByKompetisi = (kompetisiId: number) => {
    return registrations.filter(
      reg => reg.kompetisiId === kompetisiId && reg.status !== 'cancelled'
    );
  };

  const getRegistrationsByAtlit = (atlitId: number) => {
    return registrations.filter(
      reg => reg.atlitId === atlitId && reg.status !== 'cancelled'
    );
  };

  const updateKompetisiParticipants = (kompetisiId: number) => {
    return getRegistrationsByKompetisi(kompetisiId).length;
  };

  const value = {
    registrations,
    addRegistration,
    cancelRegistration,
    confirmRegistration,
    getRegistrationsByKompetisi,
    getRegistrationsByAtlit,
    updateKompetisiParticipants
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
};