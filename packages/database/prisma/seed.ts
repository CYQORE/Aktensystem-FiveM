import { PrismaClient, FactionKind, SecurityLevel } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed: Kern-Fraktionen mit Rangstruktur (Officer..Chief inkl. shareTier),
 * Plattform-Admin, Beispiel-Bürger. Idempotent über upsert.
 */

const RANK_TEMPLATE: Array<{
  name: string;
  level: number;
  shareTier: number;
  clearance: SecurityLevel;
}> = [
  { name: "Officer", level: 1, shareTier: 0, clearance: SecurityLevel.INTERN },
  { name: "Sergeant", level: 2, shareTier: 1, clearance: SecurityLevel.VERTRAULICH },
  { name: "Lieutenant", level: 3, shareTier: 2, clearance: SecurityLevel.BEHOERDENINTERN },
  { name: "Captain", level: 4, shareTier: 3, clearance: SecurityLevel.GEHEIM },
  { name: "Chief", level: 5, shareTier: 4, clearance: SecurityLevel.HOCHGEHEIM },
];

const FACTIONS: Array<{
  kind: FactionKind;
  name: string;
  shortName: string;
  color: string;
}> = [
  { kind: FactionKind.POLICE, name: "Los Santos Police Department", shortName: "LSPD", color: "#1d4ed8" },
  { kind: FactionKind.SHERIFF, name: "Blaine County Sheriff", shortName: "BCSO", color: "#b45309" },
  { kind: FactionKind.EMS, name: "Emergency Medical Services", shortName: "EMS", color: "#dc2626" },
  { kind: FactionKind.FIRE, name: "Fire Department", shortName: "LSFD", color: "#ea580c" },
  { kind: FactionKind.DOJ, name: "Department of Justice", shortName: "DOJ", color: "#6d28d9" },
  { kind: FactionKind.FORENSICS, name: "Forensics Division", shortName: "FOR", color: "#0f766e" },
  { kind: FactionKind.GOVERNMENT, name: "State Government", shortName: "GOV", color: "#374151" },
];

async function main() {
  // Plattform-Admin (Discord-ID aus Memory-Regel)
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

  // Beispiel-Bürger
  await prisma.citizen.upsert({
    where: { fivemCharId: "char:demo-001" },
    update: {},
    create: {
      firstName: "John",
      lastName: "Doe",
      fivemCharId: "char:demo-001",
      phone: "555-0100",
    },
  });

  console.log("Seed abgeschlossen: Fraktionen, Ränge, Admin, Demo-Bürger.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
