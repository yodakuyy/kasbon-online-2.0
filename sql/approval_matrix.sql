-- Approval Matrix Table
-- Stores the approval threshold tiers for kasbon requests
CREATE TABLE IF NOT EXISTS approval_matrix (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    min_amount BIGINT NOT NULL DEFAULT 0,
    max_amount BIGINT, -- NULL means unlimited / no cap
    layers TEXT[] NOT NULL DEFAULT ARRAY['Requestor', 'Dept. Head'], -- array of role labels
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default data (matching the existing hardcoded values)
INSERT INTO approval_matrix (id, min_amount, max_amount, layers) VALUES
    ('1', 1, 2000000, ARRAY['Requestor', 'Dept. Head']),
    ('2', 2000001, 5000000, ARRAY['Requestor', 'Dept. Head', 'Div. Head']),
    ('3', 5000001, 10000000, ARRAY['Requestor', 'Dept. Head', 'Div. Head', 'COO']),
    ('4', 10000001, NULL, ARRAY['Requestor', 'Dept. Head', 'Div. Head', 'COO', 'Finance'])
ON CONFLICT (id) DO NOTHING;
