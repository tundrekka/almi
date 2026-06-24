import { AjustesTabs } from "./ajustes-tabs";

export default function AjustesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-5">
      <AjustesTabs />
      {children}
    </div>
  );
}
