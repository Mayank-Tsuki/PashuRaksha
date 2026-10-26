require('dotenv').config();
const dns = require('dns');
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const dbPath = path.join(__dirname, 'database.json');

// Initial Seed Dataset
const defaultData = {
    organizations: [
        {
            id: 1,
            name: "Udayan Care NGO",
            category: "NGO",
            location: "Near Peta 1 / Gamma 1, Greater Noida",
            full_address: "NS-14, D Block, Gamma 1, Greater Noida, Uttar Pradesh 201310",
            rating: "4.9",
            review_count: "120+ Reviews",
            phone: "+91 11 4654 8105",
            email: "info@udayancare.org",
            website: "https://udayanwelfare.mycreativedesigns.in/animal-care-welfare/",
            accepted_animals: "Dogs, Cats, Stray Animals",
            occupied_slots: 38,
            total_slots: 50,
            thumbnail_url: "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?auto=format&fit=crop&w=300&q=80",
            description: "Prominent non-profit organization dedicated to child welfare, youth empowerment, and local community stray animal foster support in Greater Noida.",
            key_services: [
                "Child & Youth Empowerment Programs",
                "Emergency Stray Animal Foster Space",
                "Community Medical Aid & Vaccination Support",
                "Local Rescue Volunteer Network Coordination"
            ]
        },
        {
            id: 2,
            name: "Neem Karori Baba Gau Sewa",
            category: "Gaushala",
            location: "Sector 143A / Near Sector 135, Noida",
            full_address: "Sector 143A, Near Expressway Noida, Uttar Pradesh 201305",
            rating: "4.8",
            review_count: "85+ Reviews",
            phone: "+91 98991 33399",
            email: "contact@gausevanoida.org",
            website: "https://www.justdial.com/Greater-Noida/Neem-Karori-Baba-Gau-Sewa-Near-Shree-Shyam-Kunj-Sector-144-Noida-Sector-143a/011PXX11-XX11-260219075640-Z4K9_BZDET",
            accepted_animals: "Cows, Bulls, Calves, Buffaloes",
            occupied_slots: 75,
            total_slots: 100,
            thumbnail_url: "https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=300&q=80",
            description: "Dedicated cow sanctuary specializing in daily Gau Seva, emergency medical care, and lifelong shelter for injured, old, or abandoned street cattle.",
            key_services: [
                "Daily Gau Seva & Organic Fodder Feeding",
                "Veterinary Wound Care & Post-Natal Mother Cow Care",
                "24/7 Cattle Transport & Shelter Sanctuary",
                "Public Feeding & Volunteer Seva Opportunities"
            ]
        },
        {
            id: 3,
            name: "Magicvets Pet Clinic & Grooming",
            category: "Health Care Center",
            location: "Sector 2, Greater Noida West",
            full_address: "C-148, Sector 2, Patwari, Greater Noida West, Gautam Budh Nagar, UP 201310",
            rating: "4.1",
            review_count: "152 Reviews",
            phone: "+91 85108 56789",
            email: "contact@magicvets.com",
            website: "https://www.magicvets.com",
            accepted_animals: "Dogs, Cats, Goats, Small Pets",
            occupied_slots: 72,
            total_slots: 80,
            thumbnail_url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=300&q=80",
            description: "Full-service 24/7 veterinary clinic and grooming center providing advanced diagnostics, emergency surgeries, pet ambulance, and stray foster treatment.",
            key_services: [
                "24/7 Pet Ambulance & Doorstep Home Visits",
                "Advanced Digital X-Ray, Blood Diagnostics & Surgery",
                "Professional Hygienic Pet Grooming & Spa",
                "Anti-Rabies Vaccination & Parasite Prevention"
            ]
        },
        {
            id: 4,
            name: "GauNandiSewa Cow & Nandi Hospital",
            category: "Health Care Center",
            location: "Sector 62, Noida",
            full_address: "C-57, Ramlila Ground, Sector 62 (Opp. GST Bhawan), Noida, UP 201309",
            rating: "4.7",
            review_count: "94 Reviews",
            phone: "+91 98991 33399",
            email: "gaunandisewa@gmail.com",
            website: "https://www.gaunandisewa.org",
            accepted_animals: "Cows, Bulls, Nandis, Large Stray Animals",
            occupied_slots: 42,
            total_slots: 60,
            thumbnail_url: "https://images.unsplash.com/photo-1527153857715-3904f1205e23?auto=format&fit=crop&w=300&q=80",
            description: "Specialized emergency animal hospital dedicated to rescuing and operating on accident-injured bulls, cows, and street animals with intensive ICU care.",
            key_services: [
                "24/7 Emergency Accident Ambulance Dispatch",
                "Orthopedic Surgeries & Laceration Wound Care",
                "ICU Isolation Ward for Critical Stray Cattle",
                "Free Community Veterinary Consultation"
            ]
        }
    ],
    reports: [
        {
            id: 1,
            tracking_id: "PR-8042",
            species: "Dog",
            condition: "Severe Spinal Trauma & Fracture",
            location: "Greater Noida West",
            description: "Hit-and-run trauma, rear paralysis & blood loss",
            is_emergency: 1,
            status: "Emergency Ambulance Dispatched",
            assigned_handler: "Rescue Unit #3 En-route to ICU",
            created_at: new Date().toISOString()
        },
        {
            id: 2,
            tracking_id: "PR-9102",
            species: "Dog",
            condition: "Canine Parvovirus & Severe Dehydration",
            location: "Sector 62, Noida",
            description: "Viral fever, lethargy, acute electrolyte loss",
            is_emergency: 0,
            status: "Isolation Ward Treatment",
            assigned_handler: "Dr. Anita Sharma (Vet Isolation)",
            created_at: new Date().toISOString()
        }
    ],
    users: []
};

// --- Mongoose Schemas & Models ---
const organizationSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    category: { type: String, default: 'NGO' },
    location: { type: String, default: '' },
    full_address: { type: String, default: '' },
    rating: { type: String, default: '5.0' },
    review_count: { type: String, default: '0 Reviews' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    accepted_animals: { type: String, default: '' },
    occupied_slots: { type: Number, default: 0 },
    total_slots: { type: Number, default: 0 },
    thumbnail_url: { type: String, default: '' },
    description: { type: String, default: '' },
    key_services: { type: [String], default: [] }
}, { timestamps: false, versionKey: false });

const userSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    role: { type: String, required: true, enum: ['helper', 'ngo'] },
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    organizationName: { type: String, default: '' },
    location: { type: String, default: '' },
    address: { type: String, default: '' },
    capacity: { type: Number, default: 0 },
    occupiedSlots: { type: Number, default: 0 },
    animalsRescued: { type: Number, default: 0 },
    passwordSalt: { type: String, required: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() }
}, { timestamps: false, versionKey: false });

const reportSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    tracking_id: { type: String, required: true, unique: true },
    species: { type: String, required: true },
    condition: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, default: '' },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    image_url: { type: String, default: '' },
    is_emergency: { type: Number, default: 0 },
    status: { type: String, default: 'pending' },
    status_label: { type: String, default: 'Request received' },
    assigned_handler: { type: String, default: 'Awaiting rescue-center review' },
    reporterId: { type: Number, default: null },
    reporterName: { type: String, default: '' },
    reporterPhone: { type: String, default: '' },
    created_at: { type: String, default: () => new Date().toISOString() },
    updated_at: { type: String, default: null },
    handled_by: { type: Number, default: null },
    rescued_counted: { type: Boolean, default: false }
}, { timestamps: false, versionKey: false });

const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);

let isMongoConnected = false;

// Monitor connection status
mongoose.connection.on('connected', () => {
    isMongoConnected = true;
});
mongoose.connection.on('disconnected', () => {
    isMongoConnected = false;
});
mongoose.connection.on('error', (err) => {
    console.warn('[Database Notice] MongoDB connection error:', err.message);
    isMongoConnected = false;
});

// --- Local JSON Database Utilities (Fallback & Dual-Persistence) ---
function readDb() {
    if (!fs.existsSync(dbPath)) {
        fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
        return defaultData;
    }
    try {
        const raw = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error("Database read error, restoring defaults:", err);
        fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
        return defaultData;
    }
}

function writeDb(data) {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    } catch (err) {
        console.error("Database write error:", err);
    }
}

function ensureCollections() {
    const data = readDb();
    let changed = false;
    if (!Array.isArray(data.users)) { data.users = []; changed = true; }
    if (!Array.isArray(data.reports)) { data.reports = []; changed = true; }
    if (!Array.isArray(data.organizations)) { data.organizations = defaultData.organizations; changed = true; }
    if (changed) writeDb(data);
    return data;
}

function canonicalPhone(phone) {
    let digits = String(phone || '').replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
    return digits;
}

function formatDoc(doc) {
    if (!doc) return null;
    const obj = (doc && typeof doc.toObject === 'function') ? doc.toObject() : { ...doc };
    delete obj.__v;
    return obj;
}

// Sync single user to local file
function syncUserLocal(user) {
    try {
        const data = ensureCollections();
        const index = data.users.findIndex(u => u.id === Number(user.id) || canonicalPhone(u.phone) === canonicalPhone(user.phone));
        if (index >= 0) {
            data.users[index] = { ...data.users[index], ...user };
        } else {
            data.users.push(user);
        }
        writeDb(data);
    } catch (_) {}
}

// Sync single report to local file
function syncReportLocal(report) {
    try {
        const data = ensureCollections();
        const index = data.reports.findIndex(r => String(r.tracking_id).toUpperCase() === String(report.tracking_id).toUpperCase());
        if (index >= 0) {
            data.reports[index] = { ...data.reports[index], ...report };
        } else {
            data.reports.push(report);
        }
        writeDb(data);
    } catch (_) {}
}

// --- Migration & Seeding ---
async function seedInitialDataIfEmpty() {
    try {
        let localData = defaultData;
        if (fs.existsSync(dbPath)) {
            try {
                localData = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            } catch (err) {
                console.warn('[MongoDB Atlas] Could not read local database.json:', err.message);
            }
        }

        const orgCount = await Organization.countDocuments();
        if (orgCount === 0) {
            const orgsToSeed = (Array.isArray(localData.organizations) && localData.organizations.length > 0)
                ? localData.organizations
                : defaultData.organizations;
            if (orgsToSeed && orgsToSeed.length > 0) {
                await Organization.insertMany(orgsToSeed);
                console.log(`[MongoDB Atlas] Seeded ${orgsToSeed.length} organizations.`);
            }
        }

        const userCount = await User.countDocuments();
        if (userCount === 0 && Array.isArray(localData.users) && localData.users.length > 0) {
            await User.insertMany(localData.users);
            console.log(`[MongoDB Atlas] Migrated ${localData.users.length} users from database.json.`);
        }

        const reportCount = await Report.countDocuments();
        if (reportCount === 0) {
            const reportsToSeed = (Array.isArray(localData.reports) && localData.reports.length > 0)
                ? localData.reports
                : defaultData.reports;
            if (reportsToSeed && reportsToSeed.length > 0) {
                await Report.insertMany(reportsToSeed);
                console.log(`[MongoDB Atlas] Migrated ${reportsToSeed.length} reports into Atlas.`);
            }
        }
    } catch (err) {
        console.error('[MongoDB Atlas] Migration check error:', err.message);
    }
}

// --- Initialization ---
async function initDb() {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri || mongoUri.includes('<password>') || mongoUri.includes('<username>')) {
        console.log('[Database] MONGODB_URI not configured in .env. Running on local database.json.');
        isMongoConnected = false;
        return false;
    }

    try {
        console.log('[Database] Connecting to MongoDB Atlas...');
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        isMongoConnected = true;
        console.log('[Database] Successfully connected to MongoDB Atlas!');
        await seedInitialDataIfEmpty();
        return true;
    } catch (err) {
        console.warn('[Database Notice] MongoDB Atlas connection error:', err.message);
        console.log('-> Using local database.json seamlessly. (Check Atlas Network Access / IP whitelist 0.0.0.0/0)');
        isMongoConnected = false;
        return false;
    }
}

module.exports = {
    initDb,
    isAtlasConnected: () => isMongoConnected && mongoose.connection.readyState === 1,

    getOrganizations: async () => {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const orgs = await Organization.find().sort({ id: 1 }).lean();
                if (orgs && orgs.length > 0) return orgs.map(formatDoc);
            } catch (e) {
                isMongoConnected = false;
            }
        }
        return readDb().organizations || [];
    },

    getOrganizationById: async (id) => {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const org = await Organization.findOne({ id: parseInt(id, 10) }).lean();
                if (org) return formatDoc(org);
            } catch (e) {
                isMongoConnected = false;
            }
        }
        return (readDb().organizations || []).find(o => o.id === parseInt(id, 10));
    },

    getReports: async () => {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const reports = await Report.find().lean();
                return reports.map(formatDoc);
            } catch (e) {
                isMongoConnected = false;
            }
        }
        return ensureCollections().reports;
    },

    getReportByTrackingId: async (trackingId) => {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const report = await Report.findOne({
                    tracking_id: new RegExp(`^${String(trackingId).trim()}$`, 'i')
                }).lean();
                if (report) return formatDoc(report);
            } catch (e) {
                isMongoConnected = false;
            }
        }
        return ensureCollections().reports.find(r => String(r.tracking_id).toUpperCase() === String(trackingId).toUpperCase());
    },

    addReport: async (report) => {
        const data = ensureCollections();
        const nextIdLocal = data.reports.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1;
        const newReport = {
            id: nextIdLocal,
            created_at: new Date().toISOString(),
            ...report
        };
        data.reports.push(newReport);
        writeDb(data);

        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const lastReport = await Report.findOne().sort({ id: -1 }).lean();
                const nextId = (lastReport && Number(lastReport.id) ? Number(lastReport.id) : 0) + 1;
                newReport.id = nextId;
                const mongoReport = new Report(newReport);
                await mongoReport.save();
                return formatDoc(mongoReport);
            } catch (e) {
                console.warn('[Database] Report saved locally (Atlas sync error):', e.message);
                isMongoConnected = false;
            }
        }
        return newReport;
    },

    getUserByPhone: async (phone) => {
        const canon = canonicalPhone(phone);
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const users = await User.find().lean();
                const user = users.find(u => canonicalPhone(u.phone) === canon);
                if (user) {
                    syncUserLocal(user);
                    return formatDoc(user);
                }
            } catch (e) {
                console.warn('[Database] Atlas query failed during login, checking local fallback:', e.message);
                isMongoConnected = false;
            }
        }
        const localUser = ensureCollections().users.find(u => canonicalPhone(u.phone) === canon);
        return localUser || null;
    },

    getUserById: async (id) => {
        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const user = await User.findOne({ id: Number(id) }).lean();
                if (user) return formatDoc(user);
            } catch (e) {
                isMongoConnected = false;
            }
        }
        return ensureCollections().users.find(u => u.id === Number(id)) || null;
    },

    addUser: async (user) => {
        const data = ensureCollections();
        const nextIdLocal = data.users.reduce((max, u) => Math.max(max, Number(u.id) || 0), 0) + 1;
        const newUser = {
            id: nextIdLocal,
            ...user
        };
        data.users.push(newUser);
        writeDb(data);

        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const lastUser = await User.findOne().sort({ id: -1 }).lean();
                const nextId = (lastUser && Number(lastUser.id) ? Number(lastUser.id) : 0) + 1;
                newUser.id = nextId;
                const mongoUser = new User(newUser);
                await mongoUser.save();
                return formatDoc(mongoUser);
            } catch (e) {
                console.warn('[Database] User registered locally (Atlas sync error):', e.message);
                isMongoConnected = false;
            }
        }
        return newUser;
    },

    updateUser: async (id, updates) => {
        const data = ensureCollections();
        const index = data.users.findIndex(u => u.id === Number(id));
        let updatedLocal = null;
        if (index >= 0) {
            data.users[index] = { ...data.users[index], ...updates };
            writeDb(data);
            updatedLocal = data.users[index];
        }

        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const updated = await User.findOneAndUpdate(
                    { id: Number(id) },
                    { $set: updates },
                    { new: true }
                );
                if (updated) return formatDoc(updated);
            } catch (e) {
                isMongoConnected = false;
            }
        }
        return updatedLocal;
    },

    updateReportStatus: async (trackingId, status, user) => {
        const statusLabelMap = {
            accepted: 'Accepted by rescue center',
            rejected: 'Request declined by rescue center',
            in_progress: 'Rescue in progress',
            rescued: 'Animal rescued'
        };

        const data = ensureCollections();
        const report = data.reports.find(r => String(r.tracking_id).toUpperCase() === String(trackingId).toUpperCase());
        if (report) {
            report.status = status;
            report.status_label = statusLabelMap[status] || status;
            report.assigned_handler = user.organizationName || user.name;
            report.updated_at = new Date().toISOString();
            report.handled_by = user.id;
            if (status === 'rescued' && !report.rescued_counted) {
                const handler = data.users.find(u => u.id === Number(user.id));
                if (handler) {
                    handler.animalsRescued = (Number(handler.animalsRescued) || 0) + 1;
                    report.rescued_counted = true;
                }
            }
            writeDb(data);
        }

        if (isMongoConnected && mongoose.connection.readyState === 1) {
            try {
                const mReport = await Report.findOne({
                    tracking_id: new RegExp(`^${String(trackingId).trim()}$`, 'i')
                });
                if (mReport) {
                    mReport.status = status;
                    mReport.status_label = statusLabelMap[status] || status;
                    mReport.assigned_handler = user.organizationName || user.name;
                    mReport.updated_at = new Date().toISOString();
                    mReport.handled_by = user.id;

                    if (status === 'rescued' && !mReport.rescued_counted) {
                        await User.findOneAndUpdate(
                            { id: Number(user.id) },
                            { $inc: { animalsRescued: 1 } }
                        );
                        mReport.rescued_counted = true;
                    }
                    await mReport.save();
                    return formatDoc(mReport);
                }
            } catch (e) {
                isMongoConnected = false;
            }
        }
        return report;
    }
};
