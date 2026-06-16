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

const F = OffenseClass.FELONY, M = OffenseClass.MISDEMEANOR, I = OffenseClass.INFRACTION;
// Strafkatalog (deutsch), Kategorien wie nn_mdt: Verkehr/Vergehen/Verbrechen/Waffen/Drogen/Behörde
const PENAL_CODE = [
  // Verkehr
  { code: "VK-01", title: "Überhöhte Geschwindigkeit", category: "Verkehr", class: I, fineMin: 150, fineMax: 800, jailDaysMin: 0, jailDaysMax: 0, points: 1 },
  { code: "VK-02", title: "Rücksichtsloses Fahren", category: "Verkehr", class: M, fineMin: 750, fineMax: 2000, jailDaysMin: 0, jailDaysMax: 5, points: 3 },
  { code: "VK-03", title: "Rotlichtverstoß", category: "Verkehr", class: I, fineMin: 200, fineMax: 600, jailDaysMin: 0, jailDaysMax: 0, points: 1 },
  { code: "VK-04", title: "Missachtung Anhaltezeichen", category: "Verkehr", class: M, fineMin: 500, fineMax: 1500, jailDaysMin: 0, jailDaysMax: 3, points: 2 },
  { code: "VK-05", title: "Fahren ohne Führerschein", category: "Verkehr", class: M, fineMin: 500, fineMax: 1500, jailDaysMin: 0, jailDaysMax: 3, points: 0 },
  { code: "VK-06", title: "Unfallflucht", category: "Verkehr", class: F, fineMin: 1500, fineMax: 5000, jailDaysMin: 5, jailDaysMax: 15, points: 5 },
  { code: "VK-07", title: "Trunkenheit am Steuer", category: "Verkehr", class: M, fineMin: 1000, fineMax: 5000, jailDaysMin: 0, jailDaysMax: 10, points: 4 },
  { code: "VK-08", title: "Illegales Straßenrennen", category: "Verkehr", class: M, fineMin: 2000, fineMax: 6000, jailDaysMin: 5, jailDaysMax: 15, points: 4 },
  // Vergehen
  { code: "VG-01", title: "Hausfriedensbruch", category: "Vergehen", class: M, fineMin: 500, fineMax: 1500, jailDaysMin: 0, jailDaysMax: 5, points: 0 },
  { code: "VG-02", title: "Öffentliche Trunkenheit", category: "Vergehen", class: I, fineMin: 200, fineMax: 500, jailDaysMin: 0, jailDaysMax: 0, points: 0 },
  { code: "VG-03", title: "Erregung öffentlichen Ärgernisses", category: "Vergehen", class: M, fineMin: 300, fineMax: 800, jailDaysMin: 0, jailDaysMax: 3, points: 0 },
  { code: "VG-04", title: "Widerstand gegen Vollstreckungsbeamte", category: "Vergehen", class: M, fineMin: 1000, fineMax: 3000, jailDaysMin: 5, jailDaysMax: 15, points: 0 },
  { code: "VG-05", title: "Behinderung der Justiz", category: "Vergehen", class: M, fineMin: 1000, fineMax: 3000, jailDaysMin: 5, jailDaysMax: 15, points: 0 },
  { code: "VG-06", title: "Geringfügiger Diebstahl", category: "Vergehen", class: M, fineMin: 500, fineMax: 2000, jailDaysMin: 0, jailDaysMax: 10, points: 0 },
  { code: "VG-07", title: "Sachbeschädigung", category: "Vergehen", class: M, fineMin: 500, fineMax: 2500, jailDaysMin: 0, jailDaysMax: 7, points: 0 },
  // Verbrechen
  { code: "VB-01", title: "Schwerer Diebstahl", category: "Verbrechen", class: F, fineMin: 5000, fineMax: 15000, jailDaysMin: 20, jailDaysMax: 40, points: 0 },
  { code: "VB-02", title: "Kraftfahrzeugdiebstahl", category: "Verbrechen", class: F, fineMin: 4000, fineMax: 12000, jailDaysMin: 15, jailDaysMax: 35, points: 0 },
  { code: "VB-03", title: "Körperverletzung", category: "Verbrechen", class: F, fineMin: 3000, fineMax: 8000, jailDaysMin: 15, jailDaysMax: 30, points: 0 },
  { code: "VB-04", title: "Schwere Körperverletzung", category: "Verbrechen", class: F, fineMin: 5000, fineMax: 12000, jailDaysMin: 20, jailDaysMax: 45, points: 0 },
  { code: "VB-05", title: "Raub", category: "Verbrechen", class: F, fineMin: 5000, fineMax: 20000, jailDaysMin: 20, jailDaysMax: 50, points: 0 },
  { code: "VB-06", title: "Schwerer Raub", category: "Verbrechen", class: F, fineMin: 15000, fineMax: 30000, jailDaysMin: 40, jailDaysMax: 70, points: 0 },
  { code: "VB-07", title: "Einbruch", category: "Verbrechen", class: F, fineMin: 2000, fineMax: 8000, jailDaysMin: 10, jailDaysMax: 30, points: 0 },
  { code: "VB-08", title: "Entführung", category: "Verbrechen", class: F, fineMin: 20000, fineMax: 40000, jailDaysMin: 60, jailDaysMax: 120, points: 0 },
  { code: "VB-09", title: "Mord", category: "Verbrechen", class: F, fineMin: 0, fineMax: 0, jailDaysMin: 90, jailDaysMax: 999, points: 0 },
  { code: "VB-10", title: "Mordversuch", category: "Verbrechen", class: F, fineMin: 20000, fineMax: 40000, jailDaysMin: 60, jailDaysMax: 120, points: 0 },
  { code: "VB-11", title: "Totschlag", category: "Verbrechen", class: F, fineMin: 15000, fineMax: 30000, jailDaysMin: 40, jailDaysMax: 90, points: 0 },
  // Waffen
  { code: "WA-01", title: "Illegaler Waffenbesitz", category: "Waffen", class: F, fineMin: 5000, fineMax: 15000, jailDaysMin: 15, jailDaysMax: 40, points: 0 },
  { code: "WA-02", title: "Bedrohung mit Waffe", category: "Waffen", class: F, fineMin: 3000, fineMax: 8000, jailDaysMin: 10, jailDaysMax: 30, points: 0 },
  { code: "WA-03", title: "Schusswaffengebrauch", category: "Waffen", class: F, fineMin: 5000, fineMax: 12000, jailDaysMin: 20, jailDaysMax: 45, points: 0 },
  { code: "WA-04", title: "Besitz illegaler Waffe", category: "Waffen", class: F, fineMin: 8000, fineMax: 20000, jailDaysMin: 20, jailDaysMax: 50, points: 0 },
  // Drogen
  { code: "DR-01", title: "Drogenbesitz", category: "Drogen", class: M, fineMin: 1000, fineMax: 3000, jailDaysMin: 5, jailDaysMax: 15, points: 0 },
  { code: "DR-02", title: "Drogenbesitz mit Handelsabsicht", category: "Drogen", class: F, fineMin: 5000, fineMax: 15000, jailDaysMin: 20, jailDaysMax: 40, points: 0 },
  { code: "DR-03", title: "Drogenhandel", category: "Drogen", class: F, fineMin: 25000, fineMax: 50000, jailDaysMin: 60, jailDaysMax: 120, points: 0 },
  { code: "DR-04", title: "Drogenherstellung", category: "Drogen", class: F, fineMin: 30000, fineMax: 60000, jailDaysMin: 60, jailDaysMax: 150, points: 0 },
  // Behörde
  { code: "BH-01", title: "Flucht vor der Polizei", category: "Behörde", class: F, fineMin: 3000, fineMax: 8000, jailDaysMin: 10, jailDaysMax: 30, points: 0 },
  { code: "BH-02", title: "Nichtbefolgung von Anweisungen", category: "Behörde", class: M, fineMin: 1000, fineMax: 3000, jailDaysMin: 5, jailDaysMax: 15, points: 0 },
  { code: "BH-03", title: "Amtsanmaßung", category: "Behörde", class: F, fineMin: 5000, fineMax: 12000, jailDaysMin: 15, jailDaysMax: 40, points: 0 },
  { code: "BH-04", title: "Bestechung", category: "Behörde", class: F, fineMin: 10000, fineMax: 25000, jailDaysMin: 20, jailDaysMax: 50, points: 0 },
  { code: "BH-05", title: "Missachtung des Gerichts", category: "Behörde", class: M, fineMin: 2000, fineMax: 5000, jailDaysMin: 5, jailDaysMax: 20, points: 0 },
];

const SECTORS = [
  { code: "DT", name: "Downtown" },
  { code: "VP", name: "Vespucci" },
  { code: "MR", name: "Mission Row" },
  { code: "MP", name: "Mirror Park" },
  { code: "SS", name: "Sandy Shores" },
  { code: "PB", name: "Paleto Bay" },
];

// category = Ziel-UnitStatus (10-Code -> Einheitsstatus, von /code in-game genutzt)
const STATUS_CODES = [
  { code: "10-8", label: "Einsatzbereit", category: "FREI" },
  { code: "10-20", label: "Streife", category: "STREIFE" },
  { code: "10-11", label: "Verkehrskontrolle", category: "VERKEHRSKONTROLLE" },
  { code: "10-23", label: "Im Einsatz / vor Ort", category: "EINSATZ" },
  { code: "10-80", label: "Verfolgung", category: "VERFOLGUNG" },
  { code: "10-52", label: "Krankenhaus / Sani", category: "KRANKENHAUS" },
  { code: "10-6", label: "Pause", category: "PAUSE" },
  { code: "10-7", label: "Außer Dienst", category: "AUSSER_DIENST" },
];

const LAWS = [
  { code: "CONST-1", title: "Verfassung — Grundrechte", category: "Verfassung", body: "Grundrechte aller Bürger von San Andreas." },
  { code: "TRAF-1", title: "Straßenverkehrsordnung", category: "Verkehr", body: "Regeln des Straßenverkehrs." },
];

async function main() {
  // Hinweis: KEIN vorab gesetzter Plattform-Admin mehr. Der erste Spieler, der
  // in-game /s6mdtadmin ausführt, wird einmalig zum Admin (Bootstrap-Claim,
  // PlatformBootstrap). Discord-OAuth bleibt nur optionaler Fallback-Login.

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
