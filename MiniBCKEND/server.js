require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const TOKEN_SECRET = process.env.TOKEN_SECRET || 'replace-this-development-secret-before-deployment';

// Configure CORS: allow frontend (Vercel deployments, custom domains, and localhost)
const explicitOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    'http://127.0.0.1:3000'
].filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (explicitOrigins.includes(origin)) return callback(null, true);
        // Allow all Vercel domains (*.vercel.app)
        if (/^https:\/\/([a-zA-Z0-9-]+\.)*vercel\.app$/.test(origin)) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '20mb' }));

// Serve the existing frontend from the same server as the API. This avoids
// accidentally opening the old frontend or using a mismatched localhost port.
const frontendDir = path.join(__dirname, '..');
app.get('/', (_req, res) => res.sendFile(path.join(frontendDir, 'frontend.html')));
app.get('/frontend.html', (_req, res) => res.sendFile(path.join(frontendDir, 'frontend.html')));
app.use(express.static(frontendDir, { index: false, setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
} }));

// Uploaded animal photos are saved as files; only their URL is stored in database.
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return { salt, hash };
}
function passwordMatches(password, salt, expectedHash) {
    const actual = crypto.scryptSync(password, salt, 64);
    const expected = Buffer.from(expectedHash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function createToken(user) {
    const payload = Buffer.from(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
    const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    return `${payload}.${signature}`;
}
function readToken(token) {
    if (!token || !token.includes('.')) return null;
    const [payload, signature] = token.split('.');
    const expected = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    const a = Buffer.from(signature || ''); const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        if (!data.exp || data.exp < Date.now()) return null;
        return data;
    } catch (_) { return null; }
}
function publicUser(user) {
    const { passwordHash, passwordSalt, ...safe } = user;
    return safe;
}
async function authRequired(req, res, next) {
    try {
        const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
        const claims = readToken(token);
        if (!claims) return res.status(401).json({ error: 'Please log in to continue.' });
        const user = await db.getUserById(claims.id);
        if (!user || user.role !== claims.role) return res.status(401).json({ error: 'Your session is invalid. Please log in again.' });
        req.user = user;
        next();
    } catch (err) {
        next(err);
    }
}
function roleRequired(role) {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) return res.status(403).json({ error: 'You do not have permission to access this section.' });
        next();
    };
}
function normalizePhone(phone) {
    // Treat common Indian mobile formats as the same account number:
    // 9876543210, +91 9876543210, 91-9876543210, or 09876543210.
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    return digits;
}

app.get('/api/health', (_req, res) => res.json({
    ok: true,
    service: 'PashuRaksha API',
    database: db.isAtlasConnected() ? 'MongoDB Atlas' : 'Local JSON'
}));

// Account registration and login. Passwords are stored as scrypt hashes, never plain text.
app.post('/api/auth/register', async (req, res) => {
    try {
        const { role, name, password, location } = req.body;
        const phone = normalizePhone(req.body.phone);
        if (!['helper', 'ngo'].includes(role)) return res.status(400).json({ error: 'Choose a valid account type.' });
        if (!name || !String(name).trim()) return res.status(400).json({ error: 'Name is required.' });
        if (!/^\+?[0-9]{10,15}$/.test(phone)) return res.status(400).json({ error: 'Enter a valid mobile number (10–15 digits, optional + prefix).' });
        if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password must contain at least 6 characters.' });
        if (await db.getUserByPhone(phone)) return res.status(409).json({ error: 'An account with this mobile number already exists. Please log in.' });
        const credentials = hashPassword(password);
        const user = await db.addUser({
            role, name: String(name).trim(), phone,
            organizationName: role === 'ngo' ? String(name).trim() : '',
            location: role === 'ngo' ? String(location || '').trim() : '',
            address: '', capacity: role === 'ngo' ? Math.max(0, Number(req.body.capacity) || 0) : 0,
            occupiedSlots: 0, animalsRescued: 0,
            passwordSalt: credentials.salt, passwordHash: credentials.hash,
            createdAt: new Date().toISOString()
        });
        res.status(201).json({ message: 'Account created successfully.', token: createToken(user), user: publicUser(user) });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Could not create account.' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const phone = normalizePhone(req.body.phone);
        const { password, role } = req.body;
        if (!phone || !password || !['helper', 'ngo'].includes(role)) return res.status(400).json({ error: 'Mobile number, password, and account type are required.' });
        const user = await db.getUserByPhone(phone);
        if (!user || user.role !== role || !passwordMatches(String(password), user.passwordSalt, user.passwordHash)) {
            return res.status(401).json({ error: 'Invalid mobile number, password, or account type.' });
        }
        res.json({ message: 'Login successful.', token: createToken(user), user: publicUser(user) });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Could not log in.' });
    }
});
app.get('/api/auth/me', authRequired, (req, res) => res.json({ user: publicUser(req.user) }));
app.post('/api/auth/logout', (_req, res) => res.json({ message: 'Logged out on this device. Please discard the token.' }));

// Public shelter directory used by the existing frontend.
app.get('/api/shelters', async (_req, res) => {
    try { res.json(await db.getOrganizations()); }
    catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch organizations and shelters.' }); }
});
app.get('/api/shelters/:id', async (req, res) => {
    try {
        const org = await db.getOrganizationById(req.params.id);
        if (!org) return res.status(404).json({ error: 'Organization not found.' });
        res.json(org);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch organization.' });
    }
});

// Individual helper profile and reports, based on the authenticated account.
app.get('/api/helper/dashboard', authRequired, roleRequired('helper'), async (req, res) => {
    try {
        const allReports = await db.getReports();
        const reports = allReports.filter(report => Number(report.reporterId) === Number(req.user.id))
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json({ profile: publicUser(req.user), reports });
    } catch (err) {
        console.error('Helper dashboard error:', err);
        res.status(500).json({ error: 'Could not load helper dashboard.' });
    }
});

// Individual helper submits a rescue request. Photo is saved to uploads/ and its URL is stored in the database.
app.post('/api/reports', authRequired, roleRequired('helper'), async (req, res) => {
    let savedFilename = null;
    try {
        const { species, condition, location, description, is_emergency, photoData, latitude, longitude } = req.body;
        if (!species || !condition || !location || !String(location).trim()) {
            return res.status(400).json({ error: 'Species, condition, and location are required.' });
        }
        if (typeof photoData !== 'string' || !photoData.startsWith('data:image/')) {
            return res.status(400).json({ error: 'Please select a photo of the animal.' });
        }
        const match = photoData.match(/^data:image\/(jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=]+)$/i);
        if (!match) return res.status(400).json({ error: 'Use a JPG, PNG, or WEBP image.' });
        const imageBuffer = Buffer.from(match[2], 'base64');
        if (!imageBuffer.length || imageBuffer.length > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'The animal photo must be 10 MB or smaller.' });
        }
        const extension = match[1].toLowerCase() === 'jpg' ? 'jpg' : match[1].toLowerCase();
        const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${extension}`;
        savedFilename = filename;
        // Save image to MongoDB (and optionally to local disk for backward compatibility)
        await db.saveImage(filename, match[1] === 'png' ? 'image/png' : (match[1] === 'webp' ? 'image/webp' : 'image/jpeg'), imageBuffer);
        // Also write to local uploads folder (optional, can be removed later)
        const savedPhotoPath = path.join(uploadsDir, filename);
        fs.writeFileSync(savedPhotoPath, imageBuffer, { flag: 'wx' });
        const trackingId = `PR-${crypto.randomInt(1000, 10000)}`;
        const lat = Number(latitude), lng = Number(longitude);
        const hasCoordinates = latitude !== '' && latitude !== null && latitude !== undefined && longitude !== '' && longitude !== null && longitude !== undefined && Number.isFinite(lat) && Number.isFinite(lng);
        const report = await db.addReport({
            tracking_id: trackingId, species: String(species).slice(0, 80), condition: String(condition).slice(0, 160),
            location: String(location).trim().slice(0, 500), description: String(description || '').slice(0, 2000),
            latitude: hasCoordinates ? lat : null, longitude: hasCoordinates ? lng : null,
            image_url: `/api/image/${filename}`,
            is_emergency: is_emergency ? 1 : 0, status: 'pending',
            status_label: is_emergency ? 'Emergency request received' : 'Request received',
            assigned_handler: 'Awaiting rescue-center review', reporterId: req.user.id,
            reporterName: req.user.name, reporterPhone: req.user.phone
        });
        res.status(201).json({ message: 'Rescue report created successfully.', tracking_id: trackingId, report });
    } catch (err) {
        if (savedFilename) {
            const localPath = path.join(uploadsDir, savedFilename);
            if (fs.existsSync(localPath)) {
                try { fs.unlinkSync(localPath); } catch (_) {}
            }
        }
        console.error('Report submission error:', err);
        res.status(500).json({ error: 'Could not save the rescue report. Please try again.' });
    }
});

app.get('/api/reports/track/:tracking_id', async (req, res) => {
    try {
        const report = await db.getReportByTrackingId(req.params.tracking_id.trim());
        if (!report) return res.status(404).json({ found: false, message: 'No report found with that tracking ID.' });
        res.json({
            found: true,
            title: `${report.condition} (${report.species})`,
            status: report.status_label || report.status,
            driver: report.assigned_handler || 'Awaiting assignment',
            eta: report.status === 'rescued' ? 'Completed' : 'To be confirmed by rescue center',
            created_at: report.created_at
        });
    } catch (err) {
        console.error('Tracking query error:', err);
        res.status(500).json({ error: 'Could not retrieve rescue tracking info.' });
    }
});

// NGO dashboard and case management. Every endpoint checks the logged-in role.
app.get('/api/ngo/dashboard', authRequired, roleRequired('ngo'), async (req, res) => {
    try {
        const allReports = await db.getReports();
        const reports = allReports.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json({ profile: publicUser(req.user), reports });
    } catch (err) {
        console.error('NGO dashboard error:', err);
        res.status(500).json({ error: 'Could not load NGO dashboard.' });
    }
});

app.patch('/api/ngo/reports/:trackingId/status', authRequired, roleRequired('ngo'), async (req, res) => {
    try {
        const allowed = ['accepted', 'rejected', 'in_progress', 'rescued'];
        if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid rescue status.' });
        const report = await db.updateReportStatus(req.params.trackingId, req.body.status, req.user);
        if (!report) return res.status(404).json({ error: 'Rescue request not found.' });
        res.json({ message: 'Rescue request updated.', report });
    } catch (err) {
        console.error('Status update error:', err);
        res.status(500).json({ error: 'Could not update rescue status.' });
    }
});

app.put('/api/ngo/profile', authRequired, roleRequired('ngo'), async (req, res) => {
    try {
        const { organizationName, name, phone, location, address } = req.body;
        const normalizedPhone = normalizePhone(phone);
        if (!organizationName || !normalizedPhone || !/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
            return res.status(400).json({ error: 'Organization name and valid mobile number are required.' });
        }
        const existing = await db.getUserByPhone(normalizedPhone);
        if (existing && existing.id !== req.user.id) {
            return res.status(409).json({ error: 'That mobile number is already used by another account.' });
        }
        const capacity = Math.max(0, Number(req.body.capacity) || 0);
        const occupiedSlots = Math.max(0, Number(req.user.occupiedSlots) || 0);
        const updated = await db.updateUser(req.user.id, {
            name: String(name || organizationName).trim(),
            organizationName: String(organizationName).trim(),
            phone: normalizedPhone,
            location: String(location || '').trim(),
            address: String(address || '').trim(),
            animalsRescued: Math.max(0, Number(req.body.animalsRescued) || 0),
            capacity,
            occupiedSlots: Math.min(occupiedSlots, capacity)
        });
        res.json({ message: 'Profile saved.', user: publicUser(updated) });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ error: 'Could not save profile.' });
    }
});

// Endpoint to serve images from MongoDB
app.get('/api/image/:filename', async (req, res) => {
  try {
    const img = await db.getImage(req.params.filename);
    if (img && img.data) {
      res.set('Content-Type', img.contentType);
      return res.send(img.data);
    }
    // Fallback to local file if exists
    const localPath = path.join(uploadsDir, req.params.filename);
    if (fs.existsSync(localPath)) {
      return res.sendFile(localPath);
    }
    res.status(404).json({ error: 'Image not found' });
  } catch (e) {
    console.error('Image fetch error:', e);
    res.status(500).json({ error: 'Failed to retrieve image' });
  }
});

app.use((err, _req, res, _next) => {
    console.error('Request error:', err.message || err);
    if (err && err.type === 'entity.too.large') {
        return res.status(413).json({ error: 'The uploaded request is too large. Please use an animal photo under 10 MB.' });
    }
    if (err && err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'The submitted data could not be read. Please try again.' });
    }
    res.status(500).json({ error: 'Unexpected server error. Please try again.' });
});

async function startServer() {
    await db.initDb();
    app.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`PashuRaksha website:    http://localhost:${PORT}/`);
        console.log(`PashuRaksha API health: http://localhost:${PORT}/api/health`);
        console.log(`Database backend:       ${db.isAtlasConnected() ? 'MongoDB Atlas (Connected)' : 'Local JSON Fallback (database.json)'}`);
        console.log(`======================================================\n`);
    });
}

startServer();
