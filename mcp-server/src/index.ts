import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TOOL_DEFS, callTool } from './tools.js';

const app = express();
app.use(express.json());

const API_KEY = process.env.MCP_API_KEY;
if (!API_KEY) {
  console.error('[mcp-server] MCP_API_KEY is required for MCP access.');
}

function checkAuth(req: Request, res: Response): boolean {
  if (!API_KEY) {
    res.status(503).json({ error: 'MCP authentication is not configured' });
    return false;
  }
  const provided =
    (req.query.key as string | undefined) ??
    req.headers['x-api-key'] ??
    (req.headers.authorization?.replace(/^Bearer\s+/i, '') ?? '');
  const providedKey = Array.isArray(provided) ? provided[0] : String(provided);
  const expected = Buffer.from(API_KEY);
  const actual = Buffer.from(providedKey);
  if (actual.length === expected.length && timingSafeEqual(actual, expected)) {
    return true;
  }
  res.status(401).json({ error: 'unauthorized' });
  return false;
}

// Build the MCP server (one shared definition; per-connection transport binds to it)
const server = new Server(
  { name: 'rehab-ops', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOL_DEFS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  return callTool(name, args);
});

// Track SSE transports by sessionId so POSTs to /messages can find them.
const transports = new Map<string, SSEServerTransport>();
const authenticatedSessions = new Set<string>();

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'mcp-server',
    authConfigured: Boolean(API_KEY),
    tools: TOOL_DEFS.map((t) => t.name),
    time: new Date().toISOString(),
  });
});

app.get('/sse', async (req, res) => {
  if (!checkAuth(req, res)) return;
  const transport = new SSEServerTransport('/messages', res);
  transports.set(transport.sessionId, transport);
  authenticatedSessions.add(transport.sessionId);
  res.on('close', () => {
    transports.delete(transport.sessionId);
    authenticatedSessions.delete(transport.sessionId);
  });
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = String(req.query.sessionId ?? '');
  if (!authenticatedSessions.has(sessionId) && !checkAuth(req, res)) return;
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(400).send('No transport for sessionId');
    return;
  }
  await transport.handlePostMessage(req, res);
});

const port = Number(process.env.PORT ?? 8081);
app.listen(port, () => {
  console.log(`[mcp-server] listening on :${port}`);
  console.log(`[mcp-server] tools: ${TOOL_DEFS.map((t) => t.name).join(', ')}`);
});
