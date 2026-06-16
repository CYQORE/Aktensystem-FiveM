"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "./api";
import type {
  AppNotification,
  AuditEntry,
  CaseFile,
  Citizen,
  CourtCase,
  DispatchCall,
  EvidenceItem,
  FileShare,
  ForensicDetail,
  PlatformModule,
  Unit,
  Vehicle,
  WorkforceStats,
} from "./types";

/* ---------------- Vehicles (Fahrzeugregister) ---------------- */
export function useVehicles(q = "") {
  return useQuery({
    queryKey: ["vehicles", q],
    queryFn: () =>
      api.get<Vehicle[]>(`/vehicles${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}
export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Vehicle>("/vehicles", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}
export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.patch<Vehicle>(`/vehicles/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vehicles"] }),
  });
}

/* ---------------- Forensics ---------------- */
export function useEvidence(caseFileId: string) {
  return useQuery({
    queryKey: ["evidence", caseFileId],
    queryFn: () => api.get<EvidenceItem[]>(`/forensics/case/${caseFileId}/evidence`),
    enabled: !!caseFileId,
  });
}
export function useEvidenceItem(id: string) {
  return useQuery({
    queryKey: ["evidence-item", id],
    queryFn: () => api.get<EvidenceItem>(`/forensics/evidence/${id}`),
    enabled: !!id,
  });
}
export function useCreateEvidence(caseFileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<EvidenceItem>("/forensics/evidence", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["evidence", caseFileId] }),
  });
}
export function useAddCustody(evidenceId: string, caseFileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post(`/forensics/evidence/${evidenceId}/custody`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["evidence-item", evidenceId] });
      void qc.invalidateQueries({ queryKey: ["evidence", caseFileId] });
    },
  });
}
export function useForensicDetail(caseFileId: string) {
  return useQuery({
    queryKey: ["forensic-detail", caseFileId],
    queryFn: () => api.get<ForensicDetail | null>(`/forensics/case/${caseFileId}/detail`),
    enabled: !!caseFileId,
  });
}
export function useSaveForensicDetail(caseFileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch<ForensicDetail>(`/forensics/case/${caseFileId}/detail`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["forensic-detail", caseFileId] }),
  });
}

/* ---------------- Justice / Court ---------------- */
export function useCourtCases() {
  return useQuery({
    queryKey: ["court-cases"],
    queryFn: () => api.get<CourtCase[]>("/court-cases"),
  });
}
export function useCourtCase(id: string) {
  return useQuery({
    queryKey: ["court-case", id],
    queryFn: () => api.get<CourtCase>(`/court-cases/${id}`),
    enabled: !!id,
  });
}
export function useCreateCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<CourtCase>("/court-cases", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["court-cases"] }),
  });
}
export function useCourtAction(id: string, kind: "hearings" | "verdicts" | "sentences") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post(`/court-cases/${id}/${kind}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["court-case", id] }),
  });
}

/* ---------------- Module-Registry ---------------- */
export function useModules() {
  return useQuery({
    queryKey: ["modules"],
    queryFn: () => api.get<PlatformModule[]>("/modules"),
    staleTime: 60_000,
  });
}
export function useToggleModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      api.patch(`/modules/${key}`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}
export function useRegisterModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<PlatformModule>("/modules", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}

/* ---------------- Citizens (Bürgerregister) ---------------- */
export function useCitizens(q = "") {
  return useQuery({
    queryKey: ["citizens", q],
    queryFn: () =>
      api.get<Citizen[]>(`/citizens${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}
export function useCitizen(id: string) {
  return useQuery({
    queryKey: ["citizen", id],
    queryFn: () => api.get<Citizen>(`/citizens/${id}`),
    enabled: !!id,
  });
}
export function useCreateCitizen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<Citizen>("/citizens", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citizens"] }),
  });
}
export function useUpdateCitizen(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch<Citizen>(`/citizens/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["citizen", id] });
      void qc.invalidateQueries({ queryKey: ["citizens"] });
    },
  });
}

/* ---------------- Case Files ---------------- */
export function useCaseFiles() {
  return useQuery({
    queryKey: ["case-files"],
    queryFn: () => api.get<CaseFile[]>("/case-files"),
  });
}
export function useCaseFile(id: string) {
  return useQuery({
    queryKey: ["case-file", id],
    queryFn: () => api.get<CaseFile>(`/case-files/${id}`),
    enabled: !!id,
  });
}
export function useCreateCaseFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<CaseFile>("/case-files", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["case-files"] }),
  });
}
export function useUpdateCaseFile(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch<CaseFile>(`/case-files/${id}`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["case-file", id] });
      void qc.invalidateQueries({ queryKey: ["case-files"] });
    },
  });
}

/* ---------------- Sharing ---------------- */
export function useShares(caseFileId: string) {
  return useQuery({
    queryKey: ["shares", caseFileId],
    queryFn: () => api.get<FileShare[]>(`/case-files/${caseFileId}/shares`),
    enabled: !!caseFileId,
  });
}
export function useRequestShare(caseFileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<FileShare>(`/case-files/${caseFileId}/share`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shares", caseFileId] }),
  });
}
export function useDecideShare(caseFileId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      shareId,
      action,
      allowedFields,
    }: {
      shareId: string;
      action: "approve" | "reject" | "revoke";
      partial?: boolean;
      allowedFields?: string[];
    }) =>
      api.post<FileShare>(`/file-shares/${shareId}/${action}`, { allowedFields }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shares", caseFileId] }),
  });
}

/* ---------------- Dispatch ---------------- */
export function useDispatchCalls() {
  return useQuery({
    queryKey: ["dispatch-calls"],
    queryFn: () => api.get<DispatchCall[]>("/dispatch-calls"),
    refetchInterval: 10_000,
  });
}
export function useCreateCall() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<DispatchCall>("/dispatch-calls", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatch-calls"] }),
  });
}
export function useAssignUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ callId, unitId }: { callId: string; unitId: string }) =>
      api.post(`/dispatch-calls/${callId}/assign`, { unitId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatch-calls"] }),
  });
}
export function useUpdateCallStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ callId, status }: { callId: string; status: string }) =>
      api.patch(`/dispatch-calls/${callId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dispatch-calls"] }),
  });
}

/* ---------------- Units ---------------- */
export function useUnits() {
  return useQuery({
    queryKey: ["units"],
    queryFn: () => api.get<Unit[]>("/units"),
    refetchInterval: 15_000,
  });
}
export function useSetUnitStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, status }: { unitId: string; status: string }) =>
      api.patch(`/units/${unitId}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["units"] }),
  });
}

/* ---------------- Workforce ---------------- */
export function useWorkforceStats(period: "week" | "month" | "year" = "week") {
  return useQuery({
    queryKey: ["workforce-stats", period],
    queryFn: () => api.get<WorkforceStats>(`/workforce/stats?period=${period}`),
  });
}

/* ---------------- Audit ---------------- */
export function useAuditLog() {
  return useQuery({
    queryKey: ["audit"],
    queryFn: () => api.get<AuditEntry[]>("/audit"),
  });
}
export function useVerifyAudit() {
  return useQuery({
    queryKey: ["audit-verify"],
    queryFn: () => api.get<{ ok: boolean; brokenAt?: string }>("/audit/verify"),
  });
}

/* ---------------- Notifications ---------------- */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<AppNotification[]>("/notifications"),
  });
}
