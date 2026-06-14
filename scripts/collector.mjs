const COLLECT_URL = "http://localhost:3000/api/collect";
const INTERVAL_MINUTES = 5;

function timestamp() {
  return new Date().toLocaleTimeString("pt-BR");
}

async function collect() {
  try {
    const response = await fetch(COLLECT_URL);
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