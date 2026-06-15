// Coletor local para desenvolvimento. Em produção a coleta roda via Vercel Cron.
// Rode com: node --env-file=.env.local scripts/collector.mjs
const COLLECT_URL = process.env.COLLECT_URL ?? "http://localhost:3000/api/collect";
const INTERVAL_MINUTES = 5;
const CRON_SECRET = process.env.CRON_SECRET;

function timestamp() {
  return new Date().toLocaleTimeString("pt-BR");
}

async function collect() {
  try {
    const headers = CRON_SECRET ? { Authorization: `Bearer ${CRON_SECRET}` } : undefined;
    const response = await fetch(COLLECT_URL, { headers });
    const data = await response.json();

    if (!response.ok) {
      console.error(`[${timestamp()}] Falha na coleta:`, data.error ?? response.status);
      return;
    }

    console.log(
      `[${timestamp()}] Snapshot gravado · ${data.itemsRecorded} itens · ${data.totalRowsInDb} linhas no banco`
    );
  } catch (error) {
    console.error(`[${timestamp()}] Servidor inacessível:`, error.message);
  }
}

console.log(`Coletor Dagath iniciado · intervalo de ${INTERVAL_MINUTES} min · ${COLLECT_URL}`);
collect();
setInterval(collect, INTERVAL_MINUTES * 60 * 1000);
