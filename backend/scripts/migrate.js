// Uso (na pasta backend):
//   node scripts/migrate.js status   lista as pendentes ("PENDENTE nome"); não altera o banco
//   node scripts/migrate.js apply    aplica as pendentes, cada uma numa transação
// O deploy (deploy-one) usa estes dois comandos; saída != 0 = estado inconsistente.
import { db, run } from '../src/db.js';
import { migrationStatus, applyMigrations } from '../src/migrations.js';

const command = process.argv[2];
try {
  if (command === 'status') {
    const status = await migrationStatus();
    for (const problem of status.problems) console.log('PROBLEMA ' + problem);
    for (const m of status.pending) {
      console.log('PENDENTE ' + m.name + (m.name === '0001_baseline' && status.adoptBaseline ? ' (adotar banco existente)' : ''));
    }
    if (!status.pending.length && !status.problems.length) console.log('OK nenhuma migration pendente');
    if (status.problems.length) process.exitCode = 2;
  } else if (command === 'apply') {
    await run('PRAGMA foreign_keys = ON');
    const done = await applyMigrations();
    console.log(done.length ? `OK ${done.length} migration(s) aplicada(s)` : 'OK nenhuma migration pendente');
  } else {
    console.error('uso: node scripts/migrate.js status|apply');
    process.exitCode = 64;
  }
} catch (error) {
  console.error('ERRO ' + error.message);
  process.exitCode = 1;
} finally {
  db.close();
}
