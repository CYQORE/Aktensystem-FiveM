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
  DispatchCall,
  FileShare,
  Unit,
  WorkforceStats,
} from "./types";

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
