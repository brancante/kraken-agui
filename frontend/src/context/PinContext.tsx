"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type PinnedWidget = {
  id: string;
  type: string;
  data: any;
  pinnedAt: string;
};

interface PinContextType {
  pinnedWidgets: PinnedWidget[];
  pinWidget: (type: string, data: any) => void;
  unpinWidget: (id: string) => void;
  isPinned: (type: string) => boolean;
  getPinnedId: (type: string) => string | undefined;
}

const PinContext = createContext<PinContextType | null>(null);

export function PinProvider({ children }: { children: ReactNode }) {
  const [pinnedWidgets, setPinnedWidgets] = useState<PinnedWidget[]>([]);

  const pinWidget = useCallback((type: string, data: any) => {
    setPinnedWidgets((prev) => {
      // Replace if same type already pinned
      const filtered = prev.filter((w) => w.type !== type);
      return [...filtered, { id: crypto.randomUUID(), type, data, pinnedAt: new Date().toISOString() }];
    });
  }, []);

  const unpinWidget = useCallback((id: string) => {
    setPinnedWidgets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const isPinned = useCallback(
    (type: string) => pinnedWidgets.some((w) => w.type === type),
    [pinnedWidgets]
  );

  const getPinnedId = useCallback(
    (type: string) => pinnedWidgets.find((w) => w.type === type)?.id,
    [pinnedWidgets]
  );

  return (
    <PinContext.Provider value={{ pinnedWidgets, pinWidget, unpinWidget, isPinned, getPinnedId }}>
      {children}
    </PinContext.Provider>
  );
}

export function usePinContext() {
  const ctx = useContext(PinContext);
  if (!ctx) throw new Error("usePinContext must be used within PinProvider");
  return ctx;
}
