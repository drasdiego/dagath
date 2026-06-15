import { getSql, ensureSchema, withTransaction } from "@/lib/postgres";

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
    id: Number(row.id),
    createdAt: row.created_at,
    status: row.status,
    itemSlug: row.item_slug,
    itemName: row.item_name,
    author: row.author,
    mods: JSON.parse(row.mods_json) as SuggestionMod[],
  };
}

export const suggestionService = {
  async create(suggestion: NewSuggestion): Promise<number> {
    const sql = await getSql();
    await ensureSchema();

    const { rows } = await sql<{ id: number }>`
      INSERT INTO mod_suggestions (created_at, status, item_slug, item_name, author, mods_json)
      VALUES (${new Date().toISOString()}, 'pending', ${suggestion.itemSlug}, ${suggestion.itemName}, ${suggestion.author}, ${JSON.stringify(suggestion.mods)})
      RETURNING id
    `;
    return Number(rows[0].id);
  },

  async listPending(): Promise<Suggestion[]> {
    const sql = await getSql();
    await ensureSchema();

    const { rows } = await sql<SuggestionRow>`
      SELECT id, created_at, status, item_slug, item_name, author, mods_json
      FROM mod_suggestions
      WHERE status = 'pending'
      ORDER BY created_at ASC
    `;
    return rows.map(rowToSuggestion);
  },

  async approve(id: number): Promise<boolean> {
    const sql = await getSql();
    await ensureSchema();

    const { rows } = await sql<SuggestionRow>`
      SELECT id, created_at, status, item_slug, item_name, author, mods_json
      FROM mod_suggestions
      WHERE id = ${id}
    `;
    const row = rows[0];
    if (!row || row.status !== "pending") return false;

    const suggestion = rowToSuggestion(row);
    const source = suggestion.author
      ? `Sugerido por ${suggestion.author} · comunidade Dagath`
      : "Sugestão da comunidade Dagath";

    await withTransaction(async (tx) => {
      await tx`DELETE FROM recommended_mods WHERE item_slug = ${suggestion.itemSlug}`;
      let position = 1;
      for (const mod of suggestion.mods) {
        await tx`
          INSERT INTO recommended_mods (item_slug, mod_name, mod_slug, role, note, position, source)
          VALUES (${suggestion.itemSlug}, ${mod.modName}, ${mod.modSlug}, ${mod.role}, ${mod.note}, ${position}, ${source})
        `;
        position += 1;
      }
      await tx`UPDATE mod_suggestions SET status = 'approved' WHERE id = ${id}`;
    });

    return true;
  },

  async reject(id: number): Promise<boolean> {
    const sql = await getSql();
    await ensureSchema();

    const { rows } = await sql<{ status: string }>`
      SELECT status FROM mod_suggestions WHERE id = ${id}
    `;
    if (!rows[0] || rows[0].status !== "pending") return false;

    await sql`UPDATE mod_suggestions SET status = 'rejected' WHERE id = ${id}`;
    return true;
  },

  async approveAll(): Promise<number> {
    const pending = await this.listPending();
    let count = 0;
    for (const suggestion of pending) {
      if (await this.approve(suggestion.id)) count += 1;
    }
    return count;
  },
};
