import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createDefaultDocument } from '@figma-app/document-model';
import { DocumentModel, Comment, UserRole } from '@figma-app/shared-types';
import { RegisterSchema, LoginSchema } from '@figma-app/validation';
import { db } from './database';

const app = express();
const port = process.env.PORT || 4000;

// app.use(cors());
const allowedOrigin = process.env.CLIENT_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin, credentials: true }));
app.use(express.json());

const documents: Record<string, DocumentModel> = {
  // 'demo-doc': createDefaultDocument('Interactive Figma Demo'),
  'demo-doc': { ...createDefaultDocument('Interactive Figma Demo'), id: 'demo-doc' },
};

// Auth Middleware helper
function authenticate(req: express.Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const user = db.verifySession(token);
  return user ? user.id : null;
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    usersCount: db.users.size,
    documentsCount: Object.keys(documents).length,
  });
});

// Authentication Endpoints
// app.post('/api/auth/register', (req, res) => {
//   const { name, email, password } = req.body;
//   if (!name || !email || !password) {
//     return res.status(400).json({ error: 'Name, email, and password required' });
//   }
//   const existing = db.getUserByEmail(email);
//   if (existing) {
//     return res.status(409).json({ error: 'User with this email already exists' });
//   }
//   const user = db.createUser(name, email, password);
//   const token = db.createSession(user.id);
//   const { passwordHash, ...safeUser } = user;
//   res.status(201).json({ user: safeUser, token });
// });
app.post('/api/auth/register', (req, res) => {
  const parseResult = RegisterSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid input data' });
  }
  const { name, email, password } = parseResult.data;

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: 'User with this email already exists' });
  }

  const user = db.createUser(name, email, password);
  const token = db.createSession(user.id);
  const { passwordHash, ...safeUser } = user;
  res.status(201).json({ user: safeUser, token });
});

// app.post('/api/auth/login', (req, res) => {
//   const { email, password } = req.body;
//   if (!email || !password) {
//     return res.status(400).json({ error: 'Email and password required' });
//   }
//   const user = db.getUserByEmail(email);
//   if (!user || user.passwordHash !== password) {
//     return res.status(401).json({ error: 'Invalid credentials' });
//   }
//   const token = db.createSession(user.id);
//   const { passwordHash, ...safeUser } = user;
//   res.json({ user: safeUser, token });
// });
app.post('/api/auth/login', (req, res) => {
  const parseResult = LoginSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.errors[0]?.message || 'Invalid credentials' });
  }
  const { email, password } = parseResult.data;

  const user = db.getUserByEmail(email);
  if (!user || user.passwordHash !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = db.createSession(user.id);
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser, token });
});

app.get('/api/auth/me', (req, res) => {
  const userId = authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const user = db.getUserById(userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.post('/api/auth/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    db.revokeSession(authHeader.substring(7));
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// Project Endpoints
app.get('/api/projects', (req, res) => {
  const userId = authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const projects = db.getProjects(userId);
  res.json(projects);
});

app.post('/api/projects', (req, res) => {
  const userId = authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { title } = req.body;
  const project = db.createProject(title || 'Untitled Project', userId);
  res.status(201).json(project);
});

// app.delete('/api/projects/:id', (req, res) => {
//   const userId = authenticate(req);
//   if (!userId) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }
//   const success = db.deleteProject(req.params.id);
//   res.json({ success });
// });
app.delete('/api/projects/:id', (req, res) => {
  const userId = authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const success = db.deleteProject(req.params.id);
  res.json({ success });
});

app.patch('/api/projects/:id', (req, res) => {
  const userId = authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { title } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title required' });
  }
  const project = db.renameProject(req.params.id, title);
  if (!project) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.json(project);
});

app.post('/api/projects/:id/duplicate', (req, res) => {
  const userId = authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const duplicated = db.duplicateProject(req.params.id, userId);
  if (!duplicated) {
    return res.status(404).json({ error: 'Project not found' });
  }
  res.status(201).json(duplicated);
});

app.post('/api/projects/:id/restore', (req, res) => {
  const userId = authenticate(req);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const success = db.restoreProject(req.params.id);
  if (!success) {
    return res.status(404).json({ error: 'Project not found or not in trash' });
  }
  res.json({ success });
});

// Document Endpoints with Permissions
app.get('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const doc = documents[id];
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const userId = authenticate(req);
  if (userId) {
    const role = db.getPermission(id, userId);
    return res.json({ document: doc, role: role || 'editor' });
  }

  // Open read access for demo
  res.json({ document: doc, role: 'viewer' });
});

app.post('/api/documents', (req, res) => {
  const userId = authenticate(req);
  const { title } = req.body;
  const newDoc = createDefaultDocument(title || 'Untitled Design');
  documents[newDoc.id] = newDoc;

  if (userId) {
    db.setPermission(newDoc.id, userId, 'owner');
  }

  res.status(201).json({ document: newDoc, role: 'owner' });
});

app.put('/api/documents/:id', (req, res) => {
  const { id } = req.params;
  const userId = authenticate(req);

  // If user is authenticated, check role
  if (userId) {
    const role = db.getPermission(id, userId);
    if (role === 'viewer') {
      return res.status(403).json({ error: 'Insufficient permissions to edit document' });
    }
  }

  if (!documents[id]) {
    // If not found, create new document directly
    documents[id] = { ...req.body, id, updatedAt: new Date().toISOString() };
    if (userId) db.setPermission(id, userId, 'owner');
    return res.status(201).json(documents[id]);
  }

  documents[id] = { ...req.body, id, updatedAt: new Date().toISOString() };
  res.json(documents[id]);
});

// Document Collaboration Comments Endpoints
app.get('/api/documents/:id/comments', (req, res) => {
  const comments = db.getComments(req.params.id);
  res.json(comments);
});

app.post('/api/documents/:id/comments', (req, res) => {
  const { pageId, authorName, authorColor, position, content } = req.body;
  if (!position || !content) {
    return res.status(400).json({ error: 'Position and content required' });
  }

  const userId = authenticate(req) || 'usr_anonymous';
  const comment: Comment = {
    id: `cmt_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    documentId: req.params.id,
    pageId: pageId || 'page_1',
    authorId: userId,
    authorName: authorName || 'Designer',
    authorColor: authorColor || '#3b82f6',
    position,
    content,
    resolved: false,
    createdAt: new Date().toISOString(),
  };

  db.addComment(comment);

  // Broadcast comment to room
  if (rooms[req.params.id]) {
    const broadcastMsg = JSON.stringify({ type: 'comment_added', comment });
    rooms[req.params.id].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    });
  }

  res.status(201).json(comment);
});

app.patch('/api/documents/:id/comments/:commentId/resolve', (req, res) => {
  const success = db.resolveComment(req.params.id, req.params.commentId);
  if (!success) {
    return res.status(404).json({ error: 'Comment not found' });
  }

  if (rooms[req.params.id]) {
    const broadcastMsg = JSON.stringify({
      type: 'comment_resolved',
      commentId: req.params.commentId,
    });
    rooms[req.params.id].forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(broadcastMsg);
      }
    });
  }

  res.json({ success: true });
});

// WebSocket Real-time collaboration
const server = createServer(app);
const wss = new WebSocketServer({ server });

const rooms: Record<string, Set<WebSocket>> = {};

wss.on('connection', (ws) => {
  let currentDocId: string | null = null;
  let clientUserId: string | null = null;

  ws.on('message', (message: string) => {
    try {
      const data = JSON.parse(message.toString());
      if (data.type === 'join') {
        currentDocId = data.documentId;
        clientUserId = data.userId || null;
        if (!rooms[currentDocId!]) {
          rooms[currentDocId!] = new Set();
        }
        rooms[currentDocId!].add(ws);

        // Notify client of successful connection
        ws.send(JSON.stringify({ type: 'joined', documentId: currentDocId, roomSize: rooms[currentDocId!].size }));
      } else if (
        data.type === 'cursor' ||
        data.type === 'doc_change' ||
        data.type === 'sync_step'
      ) {
        if (currentDocId && rooms[currentDocId]) {
          rooms[currentDocId].forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(data));
            }
          });
        }
      }
    } catch (e) {
      console.error('Failed to parse WebSocket message', e);
    }
  });

  ws.on('close', () => {
    if (currentDocId && rooms[currentDocId]) {
      rooms[currentDocId].delete(ws);
      if (clientUserId) {
        // Broadcast presence leave
        rooms[currentDocId].forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'user_left', userId: clientUserId }));
          }
        });
      }
    }
  });
});

server.listen(port, () => {
  console.log(`[API Server] Running at http://localhost:${port}`);
});

export { app, server };
