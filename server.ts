import 'dotenv/config';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {synthesizeGroundedCounterAdvice} from './server/noaCounterHandler.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.use(express.json({limit: '1mb'}));

  app.post('/api/noa-counter', async (req, res) => {
    const body = (req.body || {}) as Record<string, unknown>;
    const result = await synthesizeGroundedCounterAdvice({
      query: typeof body.query === 'string' ? body.query : '',
      diagnosisSummary: typeof body.diagnosisSummary === 'string' ? body.diagnosisSummary : '',
      groundingText: typeof body.groundingText === 'string' ? body.groundingText : '',
    });

    if (result.status === 'error') {
      res.status(502).json({error: result.error || 'Synthesis error', recommendation: null});
      return;
    }

    res.json(result);
  });

  if (!isProduction) {
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {middlewareMode: true},
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send('Build output not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saban server running on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
