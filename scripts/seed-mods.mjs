import { createRequire } from "module";
import path from "path";

const require = createRequire(import.meta.url);
const Database = require("better-sqlite3");

const db = new Database(path.join(process.cwd(), "data", "dagath.db"));

db.exec(`
  CREATE TABLE IF NOT EXISTS recommended_mods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_slug TEXT NOT NULL,
    mod_name TEXT NOT NULL,
    mod_slug TEXT,
    role TEXT NOT NULL,
    note TEXT,
    position INTEGER NOT NULL,
    source TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_recommended_mods_item
    ON recommended_mods (item_slug);
`);

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

const clear = db.prepare("DELETE FROM recommended_mods WHERE item_slug = ?");
const insert = db.prepare(`
  INSERT INTO recommended_mods (item_slug, mod_name, mod_slug, role, note, position, source)
  VALUES (@itemSlug, @modName, @modSlug, @role, @note, @position, @source)
`);

const seed = db.transaction(() => {
  clear.run("khora_prime_set");
  KHORA_MODS.forEach(([modName, modSlug, role, note], index) => {
    insert.run({
      itemSlug: "khora_prime_set",
      modName,
      modSlug,
      role,
      note,
      position: index + 1,
      source: SOURCE,
    });
  });
});

seed();

const count = db.prepare("SELECT COUNT(*) AS total FROM recommended_mods").get();
console.log(`Seed concluído · ${count.total} mods recomendados no banco`);