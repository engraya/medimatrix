"use client";
import { createContext, useContext } from "react";
import { Doctor } from "@/types/api";
const DoctorsContext = createContext<Doctor[]>([]);
export function DoctorsProvider({ doctors, children }: { doctors: Doctor[]; children: React.ReactNode }) {
  return <DoctorsContext.Provider value={doctors}>{children}</DoctorsContext.Provider>;
}
export function useDoctors() { return useContext(DoctorsContext); }
