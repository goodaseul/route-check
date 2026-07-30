"use client";

import { useEffect } from "react";
import { usePlanScheduleStore } from "@/stores/usePlanScheduleStore";

export default function StoreHydration() {
  useEffect(() => {
    void usePlanScheduleStore.persist.rehydrate();
  }, []);

  return null;
}
