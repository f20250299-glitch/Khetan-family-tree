import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { INITIAL_FAMILY_TREE } from './src/data/initialTree';
import { FamilyTreeData } from './src/types';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'family_tree.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load or initialize family tree data
function loadTreeData(): FamilyTreeData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading family tree data file:', err);
  }
  // Fallback to initial
  saveTreeData(INITIAL_FAMILY_TREE);
  return INITIAL_FAMILY_TREE;
}

function saveTreeData(data: FamilyTreeData) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving family tree data file:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Router
  const api = express.Router();

  // Get current tree
  api.get('/tree', (req, res) => {
    const data = loadTreeData();
    // Return tree data without exposing raw password in plain response if preferred,
    // but pass editPasswordHash indicator
    res.json(data);
  });

  // Verify edit password
  api.post('/verify-password', (req, res) => {
    const { password } = req.body;
    const data = loadTreeData();
    const currentPass = data.editPasswordHash || 'family123';

    if (password === currentPass) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid password' });
    }
  });

  // Middleware to authorize edit operations
  const requirePassword = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const providedPass = req.headers['x-edit-password'];
    const data = loadTreeData();
    const currentPass = data.editPasswordHash || 'family123';

    if (providedPass === currentPass) {
      next();
    } else {
      res.status(401).json({ error: 'Unauthorized: Incorrect or missing edit password' });
    }
  };

  // Save / Update complete tree
  api.post('/tree', requirePassword, (req, res) => {
    const newTreeData = req.body as FamilyTreeData;
    if (!newTreeData || !Array.isArray(newTreeData.persons)) {
      return res.status(400).json({ error: 'Invalid tree data structure' });
    }

    const currentData = loadTreeData();
    const updatedData: FamilyTreeData = {
      ...newTreeData,
      editPasswordHash: currentData.editPasswordHash || 'family123',
      lastUpdated: new Date().toISOString(),
    };

    saveTreeData(updatedData);
    res.json({ success: true, data: updatedData });
  });

  // Change Edit Password
  api.post('/tree/password', requirePassword, (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 3) {
      return res.status(400).json({ error: 'Password must be at least 3 characters long' });
    }

    const currentData = loadTreeData();
    currentData.editPasswordHash = newPassword.trim();
    currentData.lastUpdated = new Date().toISOString();

    saveTreeData(currentData);
    res.json({ success: true });
  });

  // Reset to initial tree
  api.post('/tree/reset', requirePassword, (req, res) => {
    const fresh = {
      ...INITIAL_FAMILY_TREE,
      lastUpdated: new Date().toISOString(),
    };
    saveTreeData(fresh);
    res.json({ success: true, data: fresh });
  });

  app.use('/api', api);

  // Vite development middleware vs production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
