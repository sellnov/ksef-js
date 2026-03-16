import repl from 'node:repl';
import { KSeFClient } from '../src/index.js';

const replServer = repl.start({
  prompt: 'ksef> ',
  useGlobal: true,
  ignoreUndefined: true,
});

replServer.context.KSeFClient = KSeFClient;
replServer.context.createKSeFClient = (config = {}) => new KSeFClient(config);

console.log(
  'KSeFClient is available as `KSeFClient`; call `createKSeFClient({ token: ... })` to configure one.'
);
console.log(
  'Use `client.setToken(...)` before reaching out to protected endpoints and inspect `client.auth`/`client.sessions` managers.'
);

replServer.on('exit', () => {
  console.log('Exiting KSeF REPL.');
});
