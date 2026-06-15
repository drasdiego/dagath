import { sql } from "@vercel/postgres";

// Seed das builds curadas no Postgres.
// Requer POSTGRES_URL no ambiente. Rode com:
//   node --env-file=.env.local scripts/seed-mods.mjs

const SOURCE = "Curadoria Dagath · builds populares da comunidade";

const KHORA_MODS = [
  ["Primed Continuity", "primed_continuity", "Duração", "Base de qualquer build de Khora, sustenta o Strangledome por mais tempo"],
  ["Stretch", "stretch", "Alcance", "Aumenta a área do Strangledome e do Whipclaw"],
  ["Augur Reach", "augur_reach", "Alcance", "Complementa o Stretch para cobrir salas inteiras"],
  ["Transient Fortitude", "transient_fortitude", "Força", "Mais dano no Whipclaw com custo pequeno de duração"],
  ["Blind Rage", "blind_rage", "Força", "Força máxima para o Whipclaw derreter Steel Path"],
  ["Streamline", "streamline", "Eficiência", "Compensa o custo de energia do Blind Rage"],
  ["Adaptation", "adaptation", "Sobrevivência", "Resistência acumulada para missões longas"],
  ["Umbral Vitality", "umbral_vitality", "Sobrevivência", "Vida alta para aguentar nível alto"],
  ["Corrosive Projection", "corrosive_projection", "Aura", "Reduz armadura dos inimigos para o squad inteiro"],
  ["Cunning Drift", "cunning_drift", "Exilus", "Alcance extra no slot que não compete com os outros mods"],
];

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS recommended_mods (
      id BIGSERIAL PRIMARY KEY,
      item_slug TEXT NOT NULL,
      mod_name TEXT NOT NULL,
      mod_slug TEXT,
      role TEXT NOT NULL,
      note TEXT,
      position INTEGER NOT NULL,
      source TEXT
    );
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_recommended_mods_item ON recommended_mods (item_slug);`;

  await sql`DELETE FROM recommended_mods WHERE item_slug = 'khora_prime_set'`;

  let position = 1;
  for (const [modName, modSlug, role, note] of KHORA_MODS) {
    await sql`
      INSERT INTO recommended_mods (item_slug, mod_name, mod_slug, role, note, position, source)
      VALUES ('khora_prime_set', ${modName}, ${modSlug}, ${role}, ${note}, ${position}, ${SOURCE})
    `;
    position += 1;
  }

  const { rows } = await sql`SELECT COUNT(*)::int AS total FROM recommended_mods`;
  console.log(`Seed concluído · ${rows[0].total} mods recomendados no Postgres`);
}

main().catch((error) => {
  console.error("Falha no seed:", error);
  process.exit(1);
});
