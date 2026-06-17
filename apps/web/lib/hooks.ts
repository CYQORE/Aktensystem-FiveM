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
  Bolo,
  CaseFile,
  Citizen,
  CourtCase,
  DispatchCall,
  EvidenceItem,
  FileShare,
  Fine,
  ForensicDetail,
  Inmate,
  PlatformModule,
  Unit,
  Vehicle,
  VehicleActivity,
  VehiclePlateLookup,
  Warrant,
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
/** Kennzeichen-Abfrage (Streifen-Check): Halter + aktive BOLOs + Aktivitäten. */
export function useVehicleByPlate(plate: string) {
  return useQuery({
    queryKey: ["vehicle-plate", plate.toUpperCase()],
    queryFn: () => api.get<VehiclePlateLookup>(`/vehicles/plate/${encodeURIComponent(plate)}`),
    enabled: !!plate,
    retry: false,
  });
}
export function useAddVehicleActivity(vehicleId: string, plate?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<VehicleActivity>(`/vehicles/${vehicleId}/activity`, body),
    onSuccess: () => {
      if (plate) void qc.invalidateQueries({ queryKey: ["vehicle-plate", plate.toUpperCase()] });
    },
  });
}

/* ---------------- Haftbefehle (Warrants) ---------------- */
export function useWarrants(status = "ACTIVE", q = "") {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (q) params.set("q", q);
  const qs = params.toString();
  return useQuery({
    queryKey: ["warrants", status, q],
    queryFn: () => api.get<Warrant[]>(`/warrants${qs ? `?${qs}` : ""}`),
  });
}
export function useWarrant(id: string) {
  return useQuery({
    queryKey: ["warrant", id],
    queryFn: () => api.get<Warrant>(`/warrants/${id}`),
    enabled: !!id,
  });
}
export function useCreateWarrant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Warrant>("/warrants", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["warrants"] });
      void qc.invalidateQueries({ queryKey: ["citizen"] });
    },
  });
}
export function useWarrantAction(kind: "execute" | "cancel") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Warrant>(`/warrants/${id}/${kind}`, {}),
    onSuccess: (_d, id) => {
      void qc.invalidateQueries({ queryKey: ["warrants"] });
      void qc.invalidateQueries({ queryKey: ["warrant", id] });
      void qc.invalidateQueries({ queryKey: ["citizen"] });
    },
  });
}

/* ---------------- Fahndung (BOLO) ---------------- */
export function useBolos(active = "true") {
  return useQuery({
    queryKey: ["bolos", active],
    queryFn: () => api.get<Bolo[]>(`/bolos?active=${active}`),
  });
}
export function useCreateBolo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Bolo>("/bolos", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bolos"] }),
  });
}
export function useResolveBolo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/bolos/${id}/resolve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bolos"] }),
  });
}
export function useDeleteBolo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/bolos/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bolos"] }),
  });
}

/* ---------------- Immobilien (Properties) ---------------- */
export function useProperties(q = "") {
  return useQuery({
    queryKey: ["properties", q],
    queryFn: () => api.get<import("./types").Property[]>(`/properties${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });
}
export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<import("./types").Property>("/properties", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}
export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch<import("./types").Property>(`/properties/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
  });
}
export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/properties/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["properties"] }),
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

/* ---------------- Strafkatalog (Penal Code) ---------------- */
export function usePenalCodes(q = "", category = "") {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category && category !== "Alle") params.set("category", category);
  const qs = params.toString();
  return useQuery({
    queryKey: ["penal-codes", q, category],
    queryFn: () => api.get<import("./types").PenalCode[]>(`/penal-codes${qs ? `?${qs}` : ""}`),
  });
}
export function usePenalCodeCategories() {
  return useQuery({
    queryKey: ["penal-code-categories"],
    queryFn: () => api.get<{ category: string; count: number }[]>("/penal-codes/categories"),
  });
}
export function useCreatePenalCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/penal-codes", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["penal-codes"] });
      void qc.invalidateQueries({ queryKey: ["penal-code-categories"] });
    },
  });
}
export function useUpdatePenalCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      api.patch(`/penal-codes/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["penal-codes"] }),
  });
}
export function useDeletePenalCode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/penal-codes/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["penal-codes"] });
      void qc.invalidateQueries({ queryKey: ["penal-code-categories"] });
    },
  });
}

/* ---------------- Bußgelder (Fines) ---------------- */
export function useFines(status = "", citizenId = "") {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (citizenId) params.set("citizenId", citizenId);
  const qs = params.toString();
  return useQuery({
    queryKey: ["fines", status, citizenId],
    queryFn: () => api.get<Fine[]>(`/fines${qs ? `?${qs}` : ""}`),
  });
}
export function useIssueFine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Fine>("/fines", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["fines"] });
      void qc.invalidateQueries({ queryKey: ["citizen"] });
    },
  });
}
export function useFineAction(kind: "pay" | "waive") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Fine>(`/fines/${id}/${kind}`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["fines"] });
      void qc.invalidateQueries({ queryKey: ["citizen"] });
    },
  });
}

/* ---------------- Strafvollzug (Jail / Inmates) ---------------- */
export function useInmates(status = "ACTIVE") {
  return useQuery({
    queryKey: ["inmates", status],
    queryFn: () => api.get<Inmate[]>(`/jail?status=${status}`),
  });
}
export function useBookJail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<Inmate>("/jail", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inmates"] });
      void qc.invalidateQueries({ queryKey: ["citizen"] });
    },
  });
}
export function useReleaseInmate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<Inmate>(`/jail/${id}/release`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["inmates"] });
      void qc.invalidateQueries({ queryKey: ["citizen"] });
    },
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
/** Fraktionsgefilterte Nav-Module des angemeldeten Nutzers. */
export function useMyModules(enabled: boolean) {
  return useQuery({
    queryKey: ["my-modules"],
    queryFn: () => api.get<PlatformModule[]>("/modules/me"),
    enabled,
    staleTime: 60_000,
  });
}
export function useFactionModuleMatrix(factionId: string) {
  return useQuery({
    queryKey: ["faction-modules", factionId],
    queryFn: () => api.get<import("./types").FactionModuleRow[]>(`/modules/faction/${factionId}`),
    enabled: !!factionId,
  });
}
export function useSetFactionModule(factionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean | null }) =>
      api.patch(`/modules/faction/${factionId}/${key}`, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["faction-modules", factionId] }),
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
/** Strafakte mit Anklagepunkten anlegen (Bürgerprofil → "Akte anlegen"). */
export function useCreateCitizenRecord(citizenId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.post<CaseFile>(`/citizens/${citizenId}/records`, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["citizen", citizenId] });
      void qc.invalidateQueries({ queryKey: ["case-files"] });
    },
  });
}
export function useSetCitizenPhoto(citizenId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (photo: string) => api.patch<Citizen>(`/citizens/${citizenId}/photo`, { photo }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citizen", citizenId] }),
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

/* ---------------- Funk (Radio) ---------------- */
export function useRadioChannels() {
  return useQuery({
    queryKey: ["radio-channels"],
    queryFn: () => api.get<import("./types").RadioChannel[]>("/radio/channels"),
  });
}
export function useCreateRadioChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/radio/channels", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["radio-channels"] }),
  });
}
export function useDeleteRadioChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/radio/channels/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["radio-channels"] }),
  });
}
export function useRadioAction(kind: "join" | "leave") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post(`/radio/channels/${id}/${kind}`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["radio-channels"] }),
  });
}

/* ---------------- Status-Codes (10-Codes) ---------------- */
export function useStatusCodes() {
  return useQuery({
    queryKey: ["status-codes"],
    queryFn: () => api.get<import("./types").StatusCode[]>("/status-codes"),
    staleTime: 300_000,
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

/* ---------------- Rollen-/Rechte (Admin) ---------------- */
export function useAdminFactions() {
  return useQuery({
    queryKey: ["admin-factions"],
    queryFn: () => api.get<import("./types").AdminFaction[]>("/admin/factions"),
  });
}
export function useFactionRanks(factionId: string) {
  return useQuery({
    queryKey: ["admin-ranks", factionId],
    queryFn: () => api.get<import("./types").AdminRank[]>(`/admin/factions/${factionId}/ranks`),
    enabled: !!factionId,
  });
}
export function useSetRankGrants(factionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ rankId, grants }: { rankId: string; grants: import("./types").RankGrant[] }) =>
      api.patch(`/admin/ranks/${rankId}/grants`, { grants }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-ranks", factionId] }),
  });
}

/* ---------------- Globale Suche ---------------- */
export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => api.get<import("./types").SearchHit[]>(`/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length >= 2,
    staleTime: 10_000,
  });
}

/* ---------------- Dashboard ---------------- */
export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => api.get<import("./types").DashboardStats>("/dashboard/stats"),
    refetchInterval: 15_000,
  });
}

/* ---------------- LEO-Chat ---------------- */
export function useChatChannels() {
  return useQuery({
    queryKey: ["chat-channels"],
    queryFn: () => api.get<import("./types").ChatChannel[]>("/chat/channels"),
    staleTime: 300_000,
  });
}
export function useChatMessages(channel: string) {
  return useQuery({
    queryKey: ["chat-messages", channel],
    queryFn: () => api.get<import("./types").ChatMessage[]>(`/chat/${encodeURIComponent(channel)}/messages`),
    enabled: !!channel,
  });
}
export function useSendChat(channel: string) {
  // Kein Cache-Update hier — die Chat-Seite hängt die zurückgegebene Nachricht
  // (und WS-Broadcasts) dedupliziert per id an den Query-Cache an.
  return useMutation({
    mutationFn: (body: string) =>
      api.post<import("./types").ChatMessage>(`/chat/${encodeURIComponent(channel)}/messages`, { body }),
  });
}

/* ---------------- Tags ---------------- */
export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<import("./types").Tag[]>("/tags"),
    staleTime: 120_000,
  });
}
export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post<import("./types").Tag>("/tags", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del(`/tags/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
export function useAttachTag(citizenId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => api.post(`/tags/citizen/${citizenId}`, { tagId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citizen", citizenId] }),
  });
}
export function useDetachTag(citizenId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) => api.del(`/tags/citizen/${citizenId}/${tagId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["citizen", citizenId] }),
  });
}

/* ---------------- Einstellungen / Profil ---------------- */
export function useUserSettings() {
  return useQuery({
    queryKey: ["user-settings"],
    queryFn: () => api.get<import("./types").UserSettings>("/auth/me/settings"),
  });
}
export function useUpdateUserSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      api.patch<import("./types").UserSettings>("/auth/me/settings", body),
    // bei Erfolg UND Fehler neu laden -> optimistisch gesetztes Theme heilt sich
    onSettled: () => qc.invalidateQueries({ queryKey: ["user-settings"] }),
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
