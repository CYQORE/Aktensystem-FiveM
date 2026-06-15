import { AppShell } from "../../components/app-shell";

/** Layout für den authentifizierten Plattform-Bereich (Sidebar + Topbar). */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
