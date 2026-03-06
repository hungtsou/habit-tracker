import express from 'express';
import router from './routes';
import { errorHandler } from './middleware/error';

const app = express();

app.use(express.json());
app.use('/api', router);

// Must be registered after all routes. Express identifies error handlers by arity (4 args).
app.use(errorHandler);

export default app;
