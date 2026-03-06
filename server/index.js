import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// Load .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Modena Identity API Config
const MODENA_API_URL = process.env.MODENA_API_URL || 'http://192.168.0.41:9501/modena/users';
const MODENA_API_SECRET = process.env.MODENA_API_SECRET || '81b637d8fcd2c6da6359e6963113a1170de795e4b725b84d1e0b4cfd9ec58ce9';

// Utility to fetch from Modena API with filtering or pagination
async function fetchFromModenaAPI(params = {}) {
    const query = new URLSearchParams();
    Object.keys(params).forEach(key => {
        if (params[key] !== undefined) query.append(key, params[key]);
    });

    const url = `${MODENA_API_URL}?${query.toString()}`;
    const response = await fetch(url, {
        headers: { 'Security-Code': MODENA_API_SECRET }
    });

    if (!response.ok) {
        throw new Error(`Modena API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
}

// Fetch ALL users (handling pagination) with a simple 5-minute cache
let cachedUsers = null;
let lastCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchAllModenaUsers() {
    const now = Date.now();
    if (cachedUsers && (now - lastCacheTime < CACHE_TTL)) {
        return cachedUsers;
    }

    let allData = [];
    let page = 1;
    let totalPages = 1;

    do {
        const result = await fetchFromModenaAPI({ page, perpage: 500 });
        if (result.data) {
            allData = [...allData, ...result.data];
        }
        totalPages = result.total_page || 1;
        page++;
    } while (page <= totalPages);

    cachedUsers = allData;
    lastCacheTime = now;
    return allData;
}

// Initialize Supabase Client
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Test Connection Route
app.get('/api/health', async (req, res) => {
    try {
        const result = await fetchFromModenaAPI({ page: 1, perpage: 1 });
        res.json({
            status: 'success',
            message: 'Connected to Modena Identity API successfully!',
            total_users: result.total
        });
    } catch (err) {
        console.error('API connection error:', err);
        res.status(500).json({
            status: 'error',
            message: 'Failed to connect to the Modena API',
            details: err.message
        });
    }
});

// Example route to fetch current active user (e.g. for dashboard)
// In the future this should have a token verification middleware
app.get('/api/users/me', async (req, res) => {
    try {
        // 1. Fetch users from Modena Identity API (all pages)
        const modenaUsers = await fetchAllModenaUsers();

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

        // fetch from API with filter
        const result = await fetchFromModenaAPI({
            page: 1,
            perpage: 1,
            filter: `emp_no:${emp_no}`
        });

        if (!result.data || result.data.length === 0) {
            return res.status(404).json({ status: 'error', message: 'NIP tidak ditemukan di database Modena.' });
        }

        const user = result.data[0];

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

        const rawCC = user.cost_center || '';
        let cleanCC = 'UNKNOWN-CC';
        const ccMatch = rawCC.trim().match(/^(?:\d{6,7}-)?([A-Z0-9]+-[A-Z0-9]+)\s+(.+)$/i);
        if (ccMatch) {
            cleanCC = ccMatch[1];
        } else if (rawCC.trim().match(/^[A-Z]{2,}-[A-Z]+$/i)) {
            // Case for HO-MOLOGIZ style without prefix
            cleanCC = rawCC.trim();
        }

        res.json({
            status: 'success',
            data: {
                emp_no: user.emp_no,
                name: user.employe_name,
                email: user.email,
                position: user.employee_position || user.job_title,
                department: user.organization_unit,
                cost_center: cleanCC,
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
        // 1. Get all active users from API to extract cost centers
        const allUsers = await fetchAllModenaUsers();
        const activeUsers = allUsers.filter(u => u.employee_status === 'Active' && u.cost_center);

        // 2. Parse & group cost centers
        const deptMap = {};
        activeUsers.forEach(u => {
            const raw = u.cost_center.trim();
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

// ============ APPROVAL MATRIX ENDPOINTS ============

// GET all matrix tiers
app.get('/api/approval-matrix', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('approval_matrix')
            .select('*')
            .order('min_amount', { ascending: true });

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Fetch Matrix Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// UPDATE a matrix tier
app.put('/api/approval-matrix/:id', async (req, res) => {
    const { id } = req.params;
    const { min_amount, max_amount, layers } = req.body;
    try {
        const { data, error } = await supabase
            .from('approval_matrix')
            .update({
                min_amount,
                max_amount,
                layers,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Update Matrix Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============ ORG CHAIN ENDPOINT ============
// Build the full reporting chain for a given employee (walks UP the hierarchy)
app.get('/api/org-chain/:emp_no', async (req, res) => {
    const { emp_no } = req.params;
    try {
        // 1. Get the employee
        const result = await fetchFromModenaAPI({
            page: 1,
            perpage: 1,
            filter: `emp_no:${emp_no}`
        });

        if (!result.data || !result.data.length) {
            return res.status(404).json({ status: 'error', message: 'Employee not found' });
        }

        const chain = [result.data[0]];
        let current = result.data[0];

        // 2. Walk up the hierarchy (max 8 levels for safety)
        for (let i = 0; i < 8; i++) {
            if (!current.direct_supervisorid) break;
            const bossResult = await fetchFromModenaAPI({
                page: 1,
                perpage: 1,
                filter: `emp_no:${current.direct_supervisorid}`
            });

            if (!bossResult.data || !bossResult.data.length) break;
            const boss = bossResult.data[0];

            // Prevent infinite loop
            if (chain.find(c => c.emp_no === boss.emp_no)) break;

            chain.unshift(boss); // boss goes to top
            current = boss;
        }

        res.json({ status: 'success', data: chain });
    } catch (err) {
        console.error('Org Chain Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============ ROLE-BASED USER LOOKUP ============
// Get users assigned to a specific role (e.g. FINANCE, ADMIN)
app.get('/api/role-users/:role', async (req, res) => {
    const { role } = req.params;
    try {
        // 1. Get emp_nos with this role from Supabase
        const { data: roleData, error } = await supabase
            .from('user_roles')
            .select('emp_no')
            .eq('role', role.toUpperCase());

        if (error) throw error;
        if (!roleData || roleData.length === 0) {
            return res.json({ status: 'success', data: [] });
        }

        // 2. Get their names from Modena Identity API
        const empNos = roleData.map(r => r.emp_no);
        const allUsers = await fetchAllModenaUsers();
        const roleUsers = allUsers.filter(u => empNos.includes(u.emp_no));

        res.json({ status: 'success', data: roleUsers });
    } catch (err) {
        console.error('Role Users Error:', err.message);
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
        const { requestor_emp_no, requestor_name, receiver_name, department_name, cost_center_code,
            amount, date_needed, bank_name, bank_account, purpose, items, approvalPath, slot_used, type, slot_justification
        } = req.body;

        console.log('Incoming Kasbon Request:', { id: requestor_name, slot_justification }); // Add logging

        // Auto Generate ID: YY.SEQUENCE (e.g., 26.00001)
        const today = new Date();
        const yy = today.getFullYear().toString().slice(-2);

        // Fetch current count for this year for sequence
        const { count } = await supabase
            .from('kasbon_requests')
            .select('*', { count: 'exact', head: true })
            .filter('id', 'ilike', `${yy}.%`);

        const sequence = ((count || 0) + 1).toString().padStart(5, '0');
        const kasbon_id = `${yy}.${sequence}`;

        // 1. Insert Request
        const { data: kasbon, error: err1 } = await supabase.from('kasbon_requests').insert({
            id: kasbon_id,
            requestor_emp_no,
            requestor_name,
            receiver_name: receiver_name || requestor_name,
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
            current_step_index: 1, // Start at 1 because 0 (Requestor) is auto-approved
            slot_justification: slot_justification
        }).select().single();

        if (err1) throw err1;
        console.log('Saved Kasbon to DB:', kasbon_id);

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
            const approvalsData = approvalPath.map((app, idx) => ({
                kasbon_id,
                approver_name: app.approverName,
                role_description: app.role,
                step_order: app.stepOrder,
                // Mark the requestor (usually first step) as APPROVED immediately
                status: idx === 0 ? 'APPROVED' : 'PENDING',
                approved_at: idx === 0 ? new Date().toISOString() : null
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

// --- SLOT REQUESTS API ---

// 1. GET ALL SLOT REQUESTS
app.get('/api/slot-requests', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('slot_requests')
            .select(`
                *,
                approvals:slot_approvals(*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Fetch Slots Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 2. CREATE NEW SLOT REQUEST
app.post('/api/slot-requests', async (req, res) => {
    try {
        const {
            requestor_emp_no, requestor_name, department_name, cost_center_code,
            reason, current_slots, requested_slots, approvalPath
        } = req.body;

        // ID: SLOT.XXX (simple sequence based on total)
        const { count } = await supabase.from('slot_requests').select('*', { count: 'exact', head: true });
        const slot_id = `SLOT-${(count + 1).toString().padStart(3, '0')}`;

        // 1. Insert Request
        const { data: slot, error: err1 } = await supabase.from('slot_requests').insert({
            id: slot_id,
            requestor_emp_no,
            requestor_name,
            department_name,
            cost_center_code,
            reason,
            current_slots,
            requested_slots,
            status: 'PENDING'
        }).select().single();

        if (err1) throw err1;

        // 2. Insert Approvals
        if (approvalPath && approvalPath.length > 0) {
            const approvalsData = approvalPath.map(ap => ({
                slot_request_id: slot_id,
                approver_name: ap.approverName,
                role_description: ap.role,
                status: ap.status,
                step_order: ap.stepOrder
            }));
            const { error: err2 } = await supabase.from('slot_approvals').insert(approvalsData);
            if (err2) throw err2;
        }

        res.json({ status: 'success', data: slot });
    } catch (err) {
        console.error('Create Slot Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 3. UPDATE SLOT REQUEST STATUS (APPROVE/REJECT)
app.put('/api/slot-requests/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, approver_name } = req.body; // status: 'APPROVED' or 'REJECTED'

    try {
        // 1. Update the request status
        const { data: slot, error: err1 } = await supabase
            .from('slot_requests')
            .update({ status: status })
            .eq('id', id)
            .select()
            .single();

        if (err1) throw err1;

        // 2. Update the approval step (simple single-step for now)
        const { error: err2 } = await supabase
            .from('slot_approvals')
            .update({
                status: status,
                approved_at: new Date().toISOString()
            })
            .eq('slot_request_id', id)
            .eq('approver_name', approver_name);

        if (err2) throw err2;

        // 3. If APPROVED, update the department_settings max_slots
        if (status === 'APPROVED') {
            const { error: err3 } = await supabase
                .from('department_settings')
                .upsert({
                    cost_center_code: slot.cost_center_code,
                    name: slot.department_name,
                    max_slots: slot.requested_slots
                }, { onConflict: 'cost_center_code' });

            if (err3) throw err3;
        }

        res.json({ status: 'success', data: slot });
    } catch (err) {
        console.error('Update Slot Status Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// 5. UPDATE KASBON STATUS (APPROVE/REJECT)
app.put('/api/kasbons/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, approver_name, remarks, isRealized, realizationItems, realizationTotal } = req.body;

    try {
        // 1. Get current request
        const { data: request, error: errFetch } = await supabase
            .from('kasbon_requests')
            .select('*, approvals:kasbon_approvals(*)')
            .eq('id', id)
            .single();

        if (errFetch) throw errFetch;

        // HANDLE REALIZATION DATA (If provided)
        if (isRealized !== undefined) {
            console.log(`Updating realization data for ${id}`);
            const { error: errReal } = await supabase
                .from('kasbon_requests')
                .update({
                    is_realized: isRealized,
                    realization_total: realizationTotal
                })
                .eq('id', id);

            if (errReal) throw errReal;

            // Save realization items if provided
            if (realizationItems && realizationItems.length > 0) {
                // Delete old realization items first
                await supabase.from('kasbon_items').delete().eq('kasbon_id', id).eq('is_realization_item', true);

                // Insert new ones
                const itemsToInsert = realizationItems.map(item => ({
                    kasbon_id: id,
                    description: item.description,
                    amount: item.amount,
                    is_realization_item: true
                }));
                const { error: errItems } = await supabase.from('kasbon_items').insert(itemsToInsert);
                if (errItems) throw errItems;
            }
        }

        // SPECIAL HANDLING FOR SETTLEMENT
        // If status is SETTLED, we don't look for pending approval steps
        if (status === 'SETTLED') {
            const { data: updated, error: errUpd } = await supabase
                .from('kasbon_requests')
                .update({ status: 'SETTLED' })
                .eq('id', id)
                .select()
                .single();

            if (errUpd) throw errUpd;

            // AUTO REVERT SLOT IF IT WAS OVER_SLOT
            if (updated.type === 'OVER_SLOT') {
                console.log(`Auto Reverting Slots for Department: ${updated.department_name} (CC: ${updated.cost_center_code})`);
                await supabase
                    .from('department_settings')
                    .update({ max_slots: 2 })
                    .eq('cost_center_code', updated.cost_center_code);
            }

            return res.json({ status: 'success', data: updated });
        }

        // 2. Find the current pending step (for APPROVAL flow)
        const currentApprovals = request.approvals.sort((a, b) => a.step_order - b.step_order);
        const myStep = currentApprovals.find(a => a.status === 'PENDING');

        if (!myStep) {
            return res.status(400).json({ status: 'error', message: 'No pending approval step found.' });
        }

        // 3. Update the specific approval status
        const updateData = {
            status: status,
            approved_at: new Date().toISOString(),
            remarks: remarks
        };

        // For Finance role, we use the name of the person who actually clicked 'Approve' (could be one of several finance team members)
        // For others (Managers/VPs), we preserve the original assigned approver name (e.g. delegated boss name)
        if (myStep.role_description === 'Finance') {
            updateData.approver_name = approver_name;
        }

        const { error: errApp } = await supabase
            .from('kasbon_approvals')
            .update(updateData)
            .eq('id', myStep.id);

        if (errApp) throw errApp;

        // 4. Update overall request status
        let finalStatus = 'PENDING';
        let nextStepIndex = request.current_step_index;

        if (status === 'REJECTED') {
            finalStatus = 'REJECTED';
        } else {
            const remainingPending = currentApprovals.filter(a => a.id !== myStep.id && a.status === 'PENDING');
            if (remainingPending.length === 0) {
                finalStatus = 'APPROVED';
            } else {
                nextStepIndex += 1;
            }
        }

        const { data: updated, error: errUpd } = await supabase
            .from('kasbon_requests')
            .update({
                status: finalStatus,
                current_step_index: nextStepIndex
            })
            .eq('id', id)
            .select()
            .single();

        if (errUpd) throw errUpd;

        res.json({ status: 'success', data: updated });
    } catch (err) {
        console.error('Update Kasbon Status Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// ============ ACTIVITY LOGS & SETTINGS ============

// GET all activity logs
app.get('/api/activity-logs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('activity_logs')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(100);

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Fetch Logs Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST new activity log
app.post('/api/activity-logs', async (req, res) => {
    try {
        const { user, action, details, type } = req.body;
        const { data, error } = await supabase
            .from('activity_logs')
            .insert([{ user, action, details, type }])
            .select()
            .single();

        if (error) throw error;
        res.json({ status: 'success', data });
    } catch (err) {
        console.error('Post Log Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// GET system setting by key
app.get('/api/settings/:key', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', req.params.key)
            .single();

        if (error && error.code !== 'PGRST116') throw error; // Ignore if not found
        res.json({ status: 'success', data: data ? data.value : null });
    } catch (err) {
        console.error('Fetch Setting Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// POST system setting (Upsert)
app.post('/api/settings/:key', async (req, res) => {
    try {
        const { value } = req.body;
        const { error } = await supabase
            .from('system_settings')
            .upsert({
                key: req.params.key,
                value,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

        if (error) throw error;
        res.json({ status: 'success', message: 'Setting saved' });
    } catch (err) {
        console.error('Save Setting Error:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`🚀 Kasbon Backend Server running on http://localhost:${PORT}`);
    console.log('✅ Modena Identity API Mode: Active');
});
