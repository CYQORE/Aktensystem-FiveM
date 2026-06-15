import {
  PrismaClient,
  FactionKind,
  SecurityLevel,
  OffenseClass,
  LicenseType,
  BusinessType,
  CaseFileType,
} from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed (Phase 2): Fraktionen + Ränge, Plattform-Admin, Demo-Bürger,
 * Penal Code, Sektoren, Status-Codes (10-Codes), Gesetze, Beispiel-Business,
 * Demo-Lizenz und eine Verhaftungs-Workflow-Definition. Idempotent über upsert.
 */

const RANK_TEMPLATE = [
  { name: "Officer", level: 1, shareTier: 0, clearance: SecurityLevel.INTERN },
  { name: "Sergeant", level: 2, shareTier: 1, clearance: SecurityLevel.VERTRAULICH },
  { name: "Lieutenant", level: 3, shareTier: 2, clearance: SecurityLevel.BEHOERDENINTERN },
  { name: "Captain", level: 4, shareTier: 3, clearance: SecurityLevel.GEHEIM },
  { name: "Chief", level: 5, shareTier: 4, clearance: SecurityLevel.HOCHGEHEIM },
];

const FACTIONS = [
  { kind: FactionKind.POLICE, name: "Los Santos Police Department", shortName: "LSPD", color: "#1d4ed8" },
  { kind: FactionKind.SHERIFF, name: "Blaine County Sheriff", shortName: "BCSO", color: "#b45309" },
  { kind: FactionKind.EMS, name: "Emergency Medical Services", shortName: "EMS", color: "#dc2626" },
  { kind: FactionKind.FIRE, name: "Fire Department", shortName: "LSFD", color: "#ea580c" },
  { kind: FactionKind.DOJ, name: "Department of Justice", shortName: "DOJ", color: "#6d28d9" },
  { kind: FactionKind.COURT, name: "Superior Court", shortName: "COURT", color: "#7c3aed" },
  { kind: FactionKind.DA_OFFICE, name: "District Attorney Office", shortName: "DA", color: "#9333ea" },
  { kind: FactionKind.CORRECTIONS, name: "Department of Corrections", shortName: "DOC", color: "#475569" },
  { kind: FactionKind.FORENSICS, name: "Forensics Division", shortName: "FOR", color: "#0f766e" },
  { kind: FactionKind.DMV, name: "Department of Motor Vehicles", shortName: "DMV", color: "#0891b2" },
  { kind: FactionKind.CUSTOMS, name: "Customs & Border", shortName: "CBP", color: "#15803d" },
  { kind: FactionKind.GOVERNMENT, name: "State Government", shortName: "GOV", color: "#374151" },
];

const PENAL_CODE = [
  { code: "PC-187", title: "Mord", class: OffenseClass.FELONY, fineMin: 0, fineMax: 0, jailDaysMin: 60, jailDaysMax: 120 },
  { code: "PC-211", title: "Raub", class: OffenseClass.FELONY, fineMin: 5000, fineMax: 20000, jailDaysMin: 20, jailDaysMax: 50 },
  { code: "PC-245", title: "Schwere Körperverletzung", class: OffenseClass.FELONY, fineMin: 3000, fineMax: 10000, jailDaysMin: 15, jailDaysMax: 40 },
  { code: "PC-459", title: "Einbruch", class: OffenseClass.FELONY, fineMin: 2000, fineMax: 8000, jailDaysMin: 10, jailDaysMax: 30 },
  { code: "PC-484", title: "Diebstahl", class: OffenseClass.MISDEMEANOR, fineMin: 500, fineMax: 3000, jailDaysMin: 0, jailDaysMax: 10 },
  { code: "VC-23152", title: "Trunkenheit am Steuer", class: OffenseClass.MISDEMEANOR, fineMin: 1000, fineMax: 5000, jailDaysMin: 0, jailDaysMax: 7 },
  { code: "VC-22350", title: "Überhöhte Geschwindigkeit", class: OffenseClass.INFRACTION, fineMin: 150, fineMax: 800, jailDaysMin: 0, jailDaysMax: 0 },
];

const SECTORS = [
  { code: "DT", name: "Downtown" },
  { code: "VP", name: "Vespucci" },
  { code: "MR", name: "Mission Row" },
  { code: "MP", name: "Mirror Park" },
  { code: "SS", name: "Sandy Shores" },
  { code: "PB", name: "Paleto Bay" },
];

const STATUS_CODES = [
  { code: "10-8", label: "Verfügbar", category: "Verfügbarkeit" },
  { code: "10-6", label: "Beschäftigt", category: "Verfügbarkeit" },
  { code: "10-7", label: "Außer Dienst", category: "Verfügbarkeit" },
  { code: "10-23", label: "Vor Ort", category: "Einsatz" },
  { code: "10-97", label: "Einsatz beendet", category: "Einsatz" },
];

const LAWS = [
  { code: "CONST-1", title: "Verfassung — Grundrechte", category: "Verfassung", body: "Grundrechte aller Bürger von San Andreas." },
  { code: "TRAF-1", title: "Straßenverkehrsordnung", category: "Verkehr", body: "Regeln des Straßenverkehrs." },
];

async function main() {
  await prisma.user.upsert({
    where: { discordId: "584086760284487697" },
    update: { isPlatformAdmin: true, clearance: SecurityLevel.HOCHGEHEIM },
    create: {
      discordId: "584086760284487697",
      username: "platform-admin",
      isPlatformAdmin: true,
      clearance: SecurityLevel.HOCHGEHEIM,
    },
  });

  for (const f of FACTIONS) {
    const faction = await prisma.faction.upsert({
      where: { shortName: f.shortName },
      update: { name: f.name, color: f.color, kind: f.kind },
      create: f,
    });
    for (const r of RANK_TEMPLATE) {
      await prisma.rank.upsert({
        where: { factionId_name: { factionId: faction.id, name: r.name } },
        update: { level: r.level, shareTier: r.shareTier, clearance: r.clearance },
        create: { ...r, factionId: faction.id },
      });
    }
  }

  const citizen = await prisma.citizen.upsert({
    where: { fivemCharId: "char:demo-001" },
    update: {},
    create: { firstName: "John", lastName: "Doe", fivemCharId: "char:demo-001", phone: "555-0100" },
  });

  for (const p of PENAL_CODE) {
    await prisma.penalCode.upsert({ where: { code: p.code }, update: p, create: p });
  }
  for (const s of SECTORS) {
    await prisma.sector.upsert({ where: { code: s.code }, update: s, create: s });
  }
  for (const c of STATUS_CODES) {
    await prisma.statusCode.upsert({ where: { code: c.code }, update: c, create: c });
  }
  for (const l of LAWS) {
    await prisma.govLaw.upsert({ where: { code: l.code }, update: l, create: l });
  }

  // Demo-Lizenz (Führerschein) für Demo-Bürger
  const dmv = await prisma.faction.findUnique({ where: { shortName: "DMV" } });
  await prisma.license.upsert({
    where: { number: "DL-0001" },
    update: {},
    create: {
      type: LicenseType.DRIVER,
      number: "DL-0001",
      citizenId: citizen.id,
      issuedByFactionId: dmv?.id,
    },
  });

  // Demo-Business (Restaurant)
  const existingBiz = await prisma.business.findFirst({ where: { name: "Burger Shot" } });
  if (!existingBiz) {
    const biz = await prisma.business.create({
      data: { name: "Burger Shot", type: BusinessType.RESTAURANT, ownerId: citizen.id, address: "Downtown" },
    });
    await prisma.menuItem.createMany({
      data: [
        { businessId: biz.id, name: "Bleeder", price: 12, category: "Burger" },
        { businessId: biz.id, name: "Money Shot Meal", price: 18, category: "Menü" },
      ],
    });
  }

  // Verhaftungs-Workflow: Verhaftung -> Staatsanwalt -> Gericht -> Gefängnis -> Archiv
  const wf = await prisma.workflowDefinition.upsert({
    where: { key: "arrest-flow" },
    update: { name: "Verhaftungsprozess" },
    create: { key: "arrest-flow", name: "Verhaftungsprozess", appliesToType: CaseFileType.STRAFAKTE },
  });
  const states = [
    { key: "arrest", name: "Verhaftung", isInitial: true, isFinal: false },
    { key: "da", name: "Staatsanwalt", isInitial: false, isFinal: false },
    { key: "court", name: "Gericht", isInitial: false, isFinal: false },
    { key: "prison", name: "Gefängnis", isInitial: false, isFinal: false },
    { key: "archive", name: "Archiv", isInitial: false, isFinal: true },
  ];
  const stateIds: Record<string, string> = {};
  for (const s of states) {
    const st = await prisma.workflowState.upsert({
      where: { definitionId_key: { definitionId: wf.id, key: s.key } },
      update: { name: s.name, isInitial: s.isInitial, isFinal: s.isFinal },
      create: { ...s, definitionId: wf.id },
    });
    stateIds[s.key] = st.id;
  }
  const order = ["arrest", "da", "court", "prison", "archive"];
  for (let i = 0; i < order.length - 1; i++) {
    const from = stateIds[order[i]];
    const to = stateIds[order[i + 1]];
    const exists = await prisma.workflowTransition.findFirst({
      where: { definitionId: wf.id, fromStateId: from, toStateId: to },
    });
    if (!exists) {
      await prisma.workflowTransition.create({
        data: { definitionId: wf.id, name: `${order[i]} → ${order[i + 1]}`, fromStateId: from, toStateId: to },
      });
    }
  }

  console.log("Seed Phase 2 abgeschlossen: Fraktionen, Penal Code, Sektoren, Status-Codes, Gesetze, Business, Lizenz, Verhaftungs-Workflow.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
