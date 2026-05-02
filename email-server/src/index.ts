import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import multer from 'multer';
import { handleInboundEmail } from './handlers/inboundEmail';
import { handleInbox } from './handlers/inbox';

const app = express();
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.json({ limit: '20mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB per attachment
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'email-server', time: new Date().toISOString() });
});

// SendGrid Inbound Parse hits this with multipart/form-data.
// Files arrive as `attachment1`, `attachment2`, ... so we use upload.any().
app.post('/webhooks/inbound-email', (req: Request, res: Response) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('inbound email upload parse failed', err);
      res.status(200).json({ ok: false, accepted: false });
      return;
    }
    void handleInboundEmail(req, res);
  });
});

app.get('/api/inbox', handleInbox);

const port = Number(process.env.PORT ?? 8080);
app.listen(port, () => {
  console.log(`[email-server] listening on :${port}`);
});
