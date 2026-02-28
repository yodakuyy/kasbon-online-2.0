import express from 'express';
import cors from 'cors';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize PostgreSQL connection pool
// This will use the connection string from the .env file
const pool = new Pool({
    connectionString: process.env.MODENA_IDENTITY_DB_URL || 'postgresql://username:password@localhost:5432/modena_identity',
    // if you're connecting to an external cloud database, you might need:
    // ssl: { rejectUnauthorized: false }
});

// Initialize Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Test Database Connection Route
app.get('/api/health', async (req, res) => {
    try {
        const client = await pool.connect();
        client.release();
        res.json({
            status: 'success',
            message: 'Connected to Modena Identity PostgreSQL successfully!'
        });
    } catch (err) {
        console.error('Database connection error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to connect to the database',
            details: err.message
        });
    }
});

// Example route to fetch current active user (e.g. for dashboard)
// In the future this should have a token verification middleware
app.get('/api/users/me', async (req, res) => {
    try {
        // 1. Fetch users from Modena Identity (Postgres)
        const { rows: modenaUsers } = await pool.query(`
            SELECT 
                emp_no, 
                employe_name, 
                employee_status,
                job_title,
                employee_position,
                organization_unit,
                organization_unit as department,
                cost_center,
                email,
                direct_supervisorid,
                direct_supervisor
            FROM modena.users 
            ORDER BY 
                CASE WHEN employee_status = 'Active' THEN 0 ELSE 1 END,
                employe_name ASC
        `);

        // 2. Fetch roles from Supabase
        const { data: supabaseRoles, error: supabaseError } = await supabase
            .from('user_roles')
            .select('emp_no, role');

        // Note: If table doesn't exist yet, this might error. 
        // We'll treat errors as "no custom roles yet" for now or log them.
        const rolesMap = {};
        if (!supabaseError && supabaseRoles) {
            supabaseRoles.forEach(r => {
                rolesMap[r.emp_no] = r.role;
            });
        }

        // 3. Merge Modena Data with Supabase Roles
        console.log(`Successfully fetched ${modenaUsers.length} users from Modena.`);
        const merged = modenaUsers.map(user => ({
            ...user,
            // Priority: Supabase Roles > Hardcoded Admin > Default User
            role: rolesMap[user.emp_no] || (user.emp_no === '2310.2639' ? 'ADMIN' : 'USER')
        }));

        res.json({
            status: 'success',
            data: merged
        });
    } catch (err) {
        console.error('Fetch Users Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Update User Role Endpoint
app.post('/api/users/role', async (req, res) => {
    const { emp_no, role } = req.body;
    try {
        if (!emp_no || !role) {
            return res.status(400).json({ status: 'error', message: 'NIP and Role are required' });
        }

        const { data, error } = await supabase
            .from('user_roles')
            .upsert({ emp_no, role }, { onConflict: 'emp_no' });

        if (error) throw error;

        res.json({ status: 'success', message: `Role ${role} assigned to ${emp_no} successfully` });
    } catch (err) {
        console.error('Update Role Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Login with NIP as both username and password
app.post('/api/auth/login', async (req, res) => {
    const { emp_no, password } = req.body;
    try {
        if (!emp_no || !password) {
            return res.status(400).json({ status: 'error', message: 'NIP / Password is required' });
        }

        // Logic "Auto Password = NIK / NIP"
        if (password !== emp_no) {
            return res.status(401).json({ status: 'error', message: 'Password salah! (Hint: Gunakan NIP Anda)' });
        }

        const { rows } = await pool.query(`
            SELECT emp_no, employe_name, employee_status, job_title, employee_position, 
                   organization_unit, email, cost_center, direct_supervisorid, direct_supervisor
            FROM modena.users 
            WHERE emp_no = $1
            LIMIT 1
        `, [emp_no]);

        if (rows.length === 0) {
            return res.status(404).json({ status: 'error', message: 'NIP tidak ditemukan di database Modena.' });
        }

        const user = rows[0];

        if (user.employee_status !== 'Active') {
            return res.status(403).json({ status: 'error', message: 'Akun karyawan sudah tidak aktif.' });
        }

        // Get role from Supabase
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('emp_no', emp_no)
            .single();

        const role = roleData?.role || (emp_no === '2310.2639' ? 'ADMIN' : 'USER');

        res.json({
            status: 'success',
            data: {
                emp_no: user.emp_no,
                name: user.employe_name,
                email: user.email,
                position: user.employee_position || user.job_title,
                department: user.organization_unit,
                cost_center: user.cost_center, // Added cost_center here
                role: role,
                direct_supervisorid: user.direct_supervisorid,
                direct_supervisor: user.direct_supervisor,
            }
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET departments — auto-parsed from Modena cost_center, merged with Supabase overrides
app.get('/api/departments', async (req, res) => {
    try {
        // 1. Get unique cost centers from Modena (active users only)
        const { rows } = await pool.query(`
            SELECT DISTINCT cost_center
            FROM modena.users 
            WHERE employee_status = 'Active' AND cost_center IS NOT NULL AND cost_center != ''
            ORDER BY cost_center
        `);

        // 2. Parse & group cost centers (strip intern prefixes)
        const deptMap = {};
        rows.forEach(r => {
            const raw = r.cost_center.trim();
            // Pattern: optional prefix (7102035-) + CODE (CB018-CC028) + space + NAME
            const match = raw.match(/^(?:\d{6,7}-)?([A-Z0-9]+-[A-Z0-9]+)\s+(.+)$/i);
            if (match) {
                const code = match[1];
                const name = match[2].trim();
                if (!deptMap[code]) {
                    deptMap[code] = { code, name };
                }
            } else if (raw.match(/^[A-Z]{2,}-[A-Z]+$/i)) {
                // Codes like "HO-MOLOGIZ", "AM-IT", "DM-HCD"
                if (!deptMap[raw]) {
                    deptMap[raw] = { code: raw, name: raw };
                }
            }
        });

        const departments = Object.values(deptMap).sort((a, b) => a.name.localeCompare(b.name));

        // 3. Get overrides from Supabase
        const { data: overrides, error: sbError } = await supabase
            .from('department_settings')
            .select('*');

        const overrideMap = {};
        if (!sbError && overrides) {
            overrides.forEach(o => { overrideMap[o.cost_center_code] = o; });
        }

        // 4. Merge: default 2 slots, 0 outstanding limit
        const result = departments.map(dept => ({
            cost_center_code: dept.code,
            name: dept.name,
            max_slots: overrideMap[dept.code]?.max_slots ?? 2,
            outstanding_limit: overrideMap[dept.code]?.outstanding_limit ?? 0,
        }));

        res.json({ status: 'success', data: result });
    } catch (err) {
        console.error('Departments Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST department settings — save override to Supabase
app.post('/api/department-settings', async (req, res) => {
    const { cost_center_code, name, max_slots, outstanding_limit } = req.body;
    try {
        if (!cost_center_code) {
            return res.status(400).json({ status: 'error', message: 'cost_center_code is required' });
        }

        const { error } = await supabase
            .from('department_settings')
            .upsert({
                cost_center_code,
                name: name || '',
                max_slots: max_slots ?? 2,
                outstanding_limit: outstanding_limit ?? 0,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'cost_center_code' });

        if (error) throw error;

        res.json({ status: 'success', message: `Settings for ${cost_center_code} saved.` });
    } catch (err) {
        console.error('Dept Settings Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- KASBON REQUESTS API ---

// 1. GET ALL KASBON REQUESTS
app.get('/api/kasbons', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('kasbon_requests')
            .select(`
                *,
                items:kasbon_items(*),
                approvals:kasbon_approvals(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Fetch Kasbons Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 2. CREATE NEW KASBON
app.post('/api/kasbons', async (req, res) => {
    try {
        const { requestor_emp_no, requestor_name, department_name, cost_center_code,
            amount, date_needed, bank_name, bank_account, purpose, items, approvalPath, slot_used, type
        } = req.body;

        // Auto Generate ID: REQ-YYYYMM-XXX
        const today = new Date();
        const yyyymm = today.toISOString().slice(0, 7).replace('-', '');
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const kasbon_id = `REQ-${yyyymm}-${randomNum}`; // Simple generate logic for now

        // 1. Insert Request
        const { data: kasbon, error: err1 } = await supabase.from('kasbon_requests').insert({
            id: kasbon_id,
            requestor_emp_no,
            requestor_name,
            department_name,
            cost_center_code,
            amount,
            date_needed,
            bank_name,
            bank_account,
            purpose,
            slot_used: slot_used || 1,
            type: type || 'REGULAR',
            status: 'PENDING',
            current_step_index: 0
        }).select().single();

        if (err1) throw err1;

        // 2. Insert Items
        if (items && items.length > 0) {
            const itemsData = items.map(item => ({
                kasbon_id,
                description: item.description,
                amount: item.amount,
                is_realization_item: false
            }));
            const { error: err2 } = await supabase.from('kasbon_items').insert(itemsData);
            if (err2) throw err2;
        }

        // 3. Insert Approvals Path
        if (approvalPath && approvalPath.length > 0) {
            const approvalsData = approvalPath.map(app => ({
                kasbon_id,
                approver_name: app.approverName,
                role_description: app.role,
                step_order: app.stepOrder,
                status: 'PENDING'
            }));
            const { error: err3 } = await supabase.from('kasbon_approvals').insert(approvalsData);
            if (err3) throw err3;
        }

        res.json({ status: 'success', data: kasbon });
    } catch (err) {
        console.error('Create Kasbon Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Kasbon Backend Server running on http://localhost:${PORT}`);
    console.log('🔗 Connecting to Modena Identity DB...');
});
