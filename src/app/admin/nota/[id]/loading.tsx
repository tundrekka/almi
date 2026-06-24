import { Spinner } from "../../tablero/spinner";

export default function Loading() {
  return (
    <div className="rounded-2xl border border-line bg-white p-10 flex items-center justify-center gap-3 text-muted text-sm">
      <Spinner className="h-5 w-5" />
      Cargando nota…
    </div>
  );
}
