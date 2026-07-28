import { PlanScheduleProvider } from "./_context/PlanScheduleContext";

export default function PlanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PlanScheduleProvider>{children}</PlanScheduleProvider>;
}
