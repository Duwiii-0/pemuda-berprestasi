import React, { createContext, useContext, useState } from "react";
import { dummyAtlits } from "../dummy/dummyAtlit";
import type { DummyAtlit } from "../dummy/dummyAtlit";

interface AtlitContextType {
  atlits: DummyAtlit[];
  addAtlit: (atlit: DummyAtlit) => void;
  updateAtlit: (atlit: DummyAtlit) => void;
}

const AtlitContext = createContext<AtlitContextType | undefined>(undefined);

export const AtlitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [atlits, setAtlits] = useState<DummyAtlit[]>(dummyAtlits);

  const addAtlit = (atlit: DummyAtlit) => {
    setAtlits(prev => [...prev, { ...atlit, id: prev.length + 1 }]);
  };

  const updateAtlit = (atlit: DummyAtlit) => {
    setAtlits(prev => prev.map(a => a.id === atlit.id ? atlit : a));
  };

  return (
    <AtlitContext.Provider value={{ atlits, addAtlit, updateAtlit }}>
      {children}
    </AtlitContext.Provider>
  );
};

export const useAtlit = () => {
  const context = useContext(AtlitContext);
  if (!context) throw new Error("useAtlit must be used within AtlitProvider");
  return context;
};