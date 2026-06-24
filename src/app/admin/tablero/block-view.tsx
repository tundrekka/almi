import { ImageViewer } from "./image-viewer";
import { PinLinkButton } from "./pin-link-button";
import { TodoList } from "./todo-list";
import type { DevBlock } from "./types";

export function formatBytes(bytes: number | undefined): string {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function fileExt(name: string | undefined, mime: string | undefined): string {
  if (name && name.includes(".")) return name.split(".").pop() ?? "";
  if (mime) return mime.split("/").pop() ?? "";
  return "";
}

export function highlight(text: string, q: string): React.ReactNode {
  if (!q) return text;
  const lc = text.toLowerCase();
  const ql = q.toLowerCase();
  const i = lc.indexOf(ql);
  if (i === -1) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="bg-mint text-ink rounded px-0.5">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

export function BlockView({
  block,
  noteId,
  signedUrls,
  q = "",
}: {
  block: DevBlock;
  noteId: string;
  signedUrls: Record<string, string>;
  q?: string;
}) {
  if (block.kind === "text") {
    return (
      <div className="text-sm whitespace-pre-wrap leading-relaxed">
        {highlight(block.text, q)}
      </div>
    );
  }
  if (block.kind === "link") {
    return (
      <div className="rounded-xl border border-line bg-paper/40 hover:bg-paper flex items-center gap-2 px-2 py-1.5 max-w-full">
        <PinLinkButton noteId={noteId} blockId={block.id} initialPinned={!!block.pinned} />
        <a
          href={block.url}
          target="_blank"
          rel="noreferrer noopener"
          className="flex-1 min-w-0 inline-flex items-baseline gap-2 px-1 text-sm"
        >
          <span className="text-electric shrink-0">↗</span>
          <span className="font-medium truncate">
            {highlight(block.label || block.url, q)}
          </span>
          {block.label ? (
            <span className="text-xs text-muted truncate">{block.url}</span>
          ) : null}
        </a>
      </div>
    );
  }
  if (block.kind === "image") {
    const src = signedUrls[block.path];
    return (
      <figure className="rounded-xl overflow-hidden border border-line bg-paper/40">
        {src ? (
          <ImageViewer src={src} alt={block.name ?? ""} caption={block.name} />
        ) : (
          <div className="p-6 text-xs text-muted">No se pudo firmar la URL.</div>
        )}
        {block.name ? (
          <figcaption className="px-3 py-1.5 text-xs text-muted">{block.name}</figcaption>
        ) : null}
      </figure>
    );
  }
  if (block.kind === "file") {
    const src = signedUrls[block.path];
    const sizeText = formatBytes(block.size);
    return (
      <a
        href={src ?? "#"}
        target="_blank"
        rel="noreferrer noopener"
        download={block.name}
        className="rounded-xl border border-line bg-paper/40 px-3 py-2 text-sm hover:bg-paper flex items-center gap-3"
      >
        <span
          className="h-9 w-9 rounded-lg bg-white border border-line flex items-center justify-center text-xs font-semibold text-muted shrink-0"
          aria-hidden
        >
          {fileExt(block.name, block.mime).toUpperCase().slice(0, 4) || "DOC"}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-medium truncate">
            {highlight(block.name ?? "Documento", q)}
          </span>
          <span className="block text-xs text-muted">
            {block.mime ?? "archivo"}
            {sizeText ? ` · ${sizeText}` : ""}
          </span>
        </span>
        <span className="text-electric text-xs shrink-0">Descargar ↓</span>
      </a>
    );
  }
  if (block.kind === "audio") {
    const src = signedUrls[block.path];
    return (
      <div className="rounded-xl border border-line bg-paper/40 p-3 flex flex-col gap-1">
        {src ? (
          <audio controls src={src} className="w-full">
            <track kind="captions" />
          </audio>
        ) : (
          <span className="text-xs text-muted">No se pudo firmar la URL.</span>
        )}
        {block.name ? <span className="text-xs text-muted">{block.name}</span> : null}
      </div>
    );
  }
  if (block.kind === "todo") {
    return <TodoList noteId={noteId} blockId={block.id} items={block.items} q={q} />;
  }
  return null;
}
