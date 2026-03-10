import './config/env';   // load and validate env before anything else
import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`[server] Listening on http://localhost:${env.PORT}`);
});
