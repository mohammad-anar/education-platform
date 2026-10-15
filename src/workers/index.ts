import notificationWorker from "./notification.worker.js";
import reportWorker from "./report.worker.js";
import rollupWorker from "./rollup.worker.js";

export { notificationWorker, reportWorker, rollupWorker };

export async function stopAllWorkers(): Promise<void> {
  await Promise.all([
    notificationWorker.close(),
    reportWorker.close(),
    rollupWorker.close(),
  ]);
}

export default {
  notificationWorker,
  reportWorker,
  rollupWorker,
  stopAllWorkers,
};
