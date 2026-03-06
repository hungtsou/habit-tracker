import customEnv from 'custom-env';

customEnv.env(process.env.NODE_ENV ?? 'development');

import app from './app';

const PORT = process.env.PORT ?? '3000';

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
