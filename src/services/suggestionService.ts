import { db } from "@/lib/db";

export type SuggestionMod = {
  modName: string;
  modSlug: string | null;
  role: string;
  note: string | null;
};

export type Suggestion = {
  id: number;
  createdAt: string;
  status: string;
  itemSlug: string;
  itemName: string;
  author: string | null;
  mods: SuggestionMod[];
};

export type NewSuggestion = {
  itemSlug: string;
  itemName: string;
  author: string | null;
  mods: SuggestionMod[];
};

const insertSuggestion = db.prepare(`
  INSERT INTO mod_suggestions (created_at, status, item_slug, item_name, author, mods_json)
  VALUES (@createdAt, 'pending', @itemSlug, @itemName, @author, @modsJson)
`);

const selectByStatus = db.prepare(`
  SELECT id, created_at, status, item_slug, item_name, author, mods_json
  FROM mod_suggestions
  WHERE status = ?
  ORDER BY created_at ASC
`);

const selectById = db.prepare(`
  SELECT id, created_at, status, item_slug, item_name, author, mods_json
  FROM mod_suggestions
  WHERE id = ?
`);

const updateStatus = db.prepare(`
  UPDATE mod_suggestions SET status = @status WHERE id = @id
`);

const clearRecommended = db.prepare(`DELETE FROM recommended_mods WHERE item_slug = ?`);

const insertRecommended = db.prepare(`
  INSERT INTO recommended_mods (item_slug, mod_name, mod_slug, role, note, position, source)
  VALUES (@itemSlug, @modName, @modSlug, @role, @note, @position, @source)
`);

type SuggestionRow = {
  id: number;
  created_at: string;
  status: string;
  item_slug: string;
  item_name: string;
  author: string | null;
  mods_json: string;
};

function rowToSuggestion(row: SuggestionRow): Suggestion {
  return {
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    itemSlug: row.item_slug,
    itemName: row.item_name,
    author: row.author,
    mods: JSON.parse(row.mods_json) as SuggestionMod[],
  };
}

export const suggestionService = {
  create(suggestion: NewSuggestion): number {
    const result = insertSuggestion.run({
      createdAt: new Date().toISOString(),
      itemSlug: suggestion.itemSlug,
      itemName: suggestion.itemName,
      author: suggestion.author,
      modsJson: JSON.stringify(suggestion.mods),
    });
    return Number(result.lastInsertRowid);
  },

  listPending(): Suggestion[] {
    const rows = selectByStatus.all("pending") as SuggestionRow[];
    return rows.map(rowToSuggestion);
  },

  approve(id: number): boolean {
    const row = selectById.get(id) as SuggestionRow | undefined;
    if (!row || row.status !== "pending") return false;

    const suggestion = rowToSuggestion(row);
    const source = suggestion.author
      ? `Sugerido por ${suggestion.author} · comunidade Dagath`
      : "Sugestão da comunidade Dagath";

    const apply = db.transaction(() => {
      clearRecommended.run(suggestion.itemSlug);
      suggestion.mods.forEach((mod, index) => {
        insertRecommended.run({
          itemSlug: suggestion.itemSlug,
          modName: mod.modName,
          modSlug: mod.modSlug,
          role: mod.role,
          note: mod.note,
          position: index + 1,
          source,
        });
      });
      updateStatus.run({ id, status: "approved" });
    });

    apply();
    return true;
  },

  reject(id: number): boolean {
    const row = selectById.get(id) as SuggestionRow | undefined;
    if (!row || row.status !== "pending") return false;
    updateStatus.run({ id, status: "rejected" });
    return true;
  },

  approveAll(): number {
    const pending = this.listPending();
    let count = 0;
    for (const suggestion of pending) {
      if (this.approve(suggestion.id)) count += 1;
    }
    return count;
  },
};