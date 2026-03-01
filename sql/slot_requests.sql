-- Sequence for slot request IDs (SLOT-001, SLOT-002, etc)
-- Must be created BEFORE the table that uses it
CREATE SEQUENCE IF NOT EXISTS slot_request_seq START 1;

-- Slot Request Table
-- Stores requests for temporary/additional kasbon slots for a department
CREATE TABLE IF NOT EXISTS slot_requests (
    id TEXT PRIMARY KEY DEFAULT 'SLOT-' || LPAD(nextval('slot_request_seq')::TEXT, 3, '0'),
    requestor_emp_no TEXT NOT NULL,
    requestor_name TEXT NOT NULL,
    department_name TEXT NOT NULL,
    cost_center_code TEXT NOT NULL,
    reason TEXT NOT NULL,
    current_slots INTEGER NOT NULL,
    requested_slots INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Slot Approvals Table
-- Tracks the approval workflow for slot requests
CREATE TABLE IF NOT EXISTS slot_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_request_id TEXT REFERENCES slot_requests(id) ON DELETE CASCADE,
    approver_name TEXT NOT NULL,
    role_description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
    step_order INTEGER NOT NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
