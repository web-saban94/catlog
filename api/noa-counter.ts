import type {IncomingMessage, ServerResponse} from 'node:http';
import {synthesizeGroundedCounterAdvice} from '../server/noaCounterHandler';

interface VercelLikeRequest extends IncomingMessage {
  method?: string;
  body?: unknown;
}

interface VercelLikeResponse extends ServerResponse {
  status(code: number): VercelLikeResponse;
  json(body: unknown): void;
}

export default async function handler(req: VercelLikeRequest, res: VercelLikeResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({error: 'Method not allowed'});
    return;
  }

  let payload: Record<string, unknown> = {};
  if (req.body && typeof req.body === 'object') {
    payload = req.body as Record<string, unknown>;
  } else {
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    try {
      payload = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as Record<string, unknown>;
    } catch {
      res.status(400).json({error: 'Invalid JSON payload'});
      return;
    }
  }

  const result = await synthesizeGroundedCounterAdvice({
    query: typeof payload.query === 'string' ? payload.query : '',
    diagnosisSummary: typeof payload.diagnosisSummary === 'string' ? payload.diagnosisSummary : '',
    groundingText: typeof payload.groundingText === 'string' ? payload.groundingText : '',
  });

  if (result.status === 'error') {
    res.status(502).json({error: result.error || 'Synthesis error', recommendation: null});
    return;
  }

  res.status(200).json(result);
}
