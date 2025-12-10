import express, { Request, Response } from 'express';
import cors from 'cors';
import { MetricUpdate } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Mock Data Configuration
const CUSTOMERS = ['Customer A', 'Customer B', 'Customer C', 'Customer D', 'Customer E'];
const TENANTS = ['Tenant 1', 'Tenant 2', 'Tenant 3'];
const MODELS = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-opus', 'gemini-pro'];

// Validated Data Buffer
let updateBuffer: MetricUpdate[] = [];
const HISTORY_LIMIT = 5000; // Keep last 5000 updates in memory for history

// Helper to generate a random update
const generateUpdate = (): MetricUpdate => {
  const customer = CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)];
  const tenant = TENANTS[Math.floor(Math.random() * TENANTS.length)];
  const model = MODELS[Math.floor(Math.random() * MODELS.length)];
  
  // Randomize metrics
  // Introduce occasional spikes
  const isSpike = Math.random() > 0.95;
  const multiplier = isSpike ? 5 + Math.random() * 5 : 1;

  const totalTokens = Math.floor((Math.random() * 1000 + 50) * multiplier);
  const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000001;
  const totalCost = totalTokens * costPerToken;
  
  return {
    timestamp: new Date().toISOString(),
    tenantId: tenant,
    customerId: customer,
    metrics: {
      totalCalls: 1, // Single call event
      totalTokens,
      totalCost,
      avgLatencyMs: Math.floor(Math.random() * 500 + 50) * (isSpike ? 2 : 1),
    }
  };
};

// Background Data Generator
const DATA_INTERVAL_MS = 50; // Generate data every 50ms (20 updates/sec approx per interval tick, can batch)
// To simulate "hundreds", we can generate batch
setInterval(() => {
  const BATCH_SIZE = Math.floor(Math.random() * 5) + 1; // 1 to 5 updates per tick
  const now = new Date();
  
  for (let i = 0; i < BATCH_SIZE; i++) {
    const update = generateUpdate();
    updateBuffer.push(update);
    // Trim buffer to avoid memory leak if no one is polling
    if (updateBuffer.length > 10000) {
        updateBuffer.shift(); 
    }
    
    // Notify Listeners (SSE)
    notifyClients(update);
  }
}, DATA_INTERVAL_MS);


// SSE Clients
let clients: { id: number; res: Response }[] = [];

const notifyClients = (update: MetricUpdate) => {
  clients.forEach(client => {
    client.res.write(`data: ${JSON.stringify(update)}\n\n`);
  });
};

// Endpoints

// GET /api/metrics
// Returns metrics since a timestamp
app.get('/api/metrics', (req: Request, reqRes: Response) => {
    // Simulate network delay
    setTimeout(() => {
        // Occasional 500 error
        if (Math.random() > 0.98) {
            return reqRes.status(500).json({ error: 'Internal Server Error' });
        }

        const since = req.query.since as string;
        let data = updateBuffer;

        if (since) {
             const sinceDate = new Date(since).getTime();
             data = updateBuffer.filter(u => new Date(u.timestamp).getTime() > sinceDate);
        } else {
            // If no since, return last 100? or empty? default to last few seconds
            // For initial load, maybe last 50
            data = updateBuffer.slice(-50);
        }

        // Return max 500 to keep payload size reasonable
        if (data.length > 500) data = data.slice(-500);

        reqRes.json({
            metrics: data,
            nextPollAfter: 2000 // Suggest 2s, but client config overrides
        });

    }, Math.random() * 200); // 0-200ms latency
});


// GET /api/stream
// SSE Endpoint
app.get('/api/stream', (req: Request, res: Response) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const client = { id: clientId, res };
  clients.push(client);

  // Send initial connected message
  // res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
  
  // Clean up on close
  req.on('close', () => {
    clients = clients.filter(c => c.id !== clientId);
  });
});

// GET /api/metrics/history
app.get('/api/metrics/history', (req: Request, res: Response) => {
    const from = req.query.from as string;
    const to = req.query.to as string;
    
    // Mock history generation on the fly based on params
    // In real app, query DB. Here, generate synthetic history.
    const history: MetricUpdate[] = [];
    const count = 100;
    
    const startTime = from ? new Date(from).getTime() : Date.now() - 3600000;
    const endTime = to ? new Date(to).getTime() : Date.now();
    const step = (endTime - startTime) / count;
    
    for (let i = 0; i < count; i++) {
        // ... generate fake history
        // Omitting for brevity in this initial pass, returning empty or buffer
    }

    // Return current buffer as "history" for now for simplicity
    res.json({ metrics: updateBuffer }); 
});

app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});
