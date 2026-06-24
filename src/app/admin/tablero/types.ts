export type TodoItem = { id: string; text: string; done: boolean };

// `group` identifica el lote en que se creó el bloque: los componentes (texto,
// link, todo…) que se agregan juntos en una misma acción comparten el mismo
// `group` y se muestran como una sola unidad, sin líneas internas.
// `author` = user id de quien creó el bloque; `at` = fecha ISO de creación.
// `tags` = etiquetas del bloque (no de la página). Todos los componentes de un
// mismo grupo comparten author/at/tags.
// (Necesarios porque una página como "General" mezcla bloques de varias personas/tags.)
type BlockMeta = {
  id: string;
  group?: string;
  author?: string;
  at?: string;
  tags?: string[];
};

export type DevBlock =
  | (BlockMeta & { kind: "text"; text: string })
  | (BlockMeta & { kind: "link"; url: string; label?: string; pinned?: boolean })
  | (BlockMeta & { kind: "image"; path: string; name?: string; mime?: string })
  | (BlockMeta & {
      kind: "audio";
      path: string;
      name?: string;
      mime?: string;
      duration_s?: number;
    })
  | (BlockMeta & {
      kind: "file";
      path: string;
      name?: string;
      mime?: string;
      size?: number;
    })
  | (BlockMeta & { kind: "todo"; items: TodoItem[] });

export type BlockKind = DevBlock["kind"];

export const BLOCK_KINDS: BlockKind[] = ["text", "link", "image", "audio", "file", "todo"];

export const KIND_LABEL: Record<BlockKind, string> = {
  text: "Texto",
  link: "Links",
  image: "Imágenes",
  audio: "Audio",
  file: "Documentos",
  todo: "To dos",
};

export type DevEdit = { user_id: string; at: string };

export type DevNote = {
  id: string;
  author_id: string;
  title: string | null;
  icon?: string | null;
  blocks: DevBlock[];
  tags: string[];
  search_text: string;
  edits: DevEdit[];
  created_at: string;
  updated_at: string;
};

export const DEV_MEDIA_BUCKET = "zalut-dev-media";

// Agrupa bloques consecutivos por su `group` (lote de creación). Los que no
// tienen group forman su propio grupo (su id como clave).
export type BlockGroup = { key: string; blocks: DevBlock[] };

export function groupBlocks(blocks: DevBlock[]): BlockGroup[] {
  const groups: BlockGroup[] = [];
  for (const b of blocks) {
    const key = b.group ?? b.id;
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.blocks.push(b);
    else groups.push({ key, blocks: [b] });
  }
  return groups;
}

// Autor / fecha del bloque (grupo). Usa el primer componente; si es data vieja
// sin esos campos, cae al valor de la página.
export function groupAuthorId(g: BlockGroup, fallback: string): string {
  return g.blocks[0]?.author ?? fallback;
}
export function groupAt(g: BlockGroup, fallback: string): string {
  return g.blocks[0]?.at ?? fallback;
}
export function groupTags(g: BlockGroup): string[] {
  return g.blocks[0]?.tags ?? [];
}
