import React, { createContext, useContext, useState, type ReactNode } from 'react';

export type UserRole = 'USER' | 'APPROVER' | 'FINANCE' | 'ADMIN';

export interface KasbonItem {
    id: string;
    description: string;
    amount: number;
}

export interface ApprovalStep {
    approverName: string;
    role: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SKIPPED';
    stepOrder: number;
    approvedAt?: string;
}

export interface MatrixConfig {
    id: string;
    minAmount: number;
    maxAmount: number | null; // null means "up"
    layers: string[]; // e.g., ["Direct Manager", "Department Head", "Head Office", "CEO"]
}

export interface DeptSetting {
    deptId: string;
    deptName: string;
    maxSlots: number;
    outstandingLimit: number;
}

export interface KasbonRequest {
    id: string;
    requestor: string;
    department: string;
    amount: number;
    date: string;
    dateNeeded: string;
    bankAccount: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'SETTLED' | 'REVOKED';
    isOverdue: boolean;
    slot: number;
    purpose: string;
    items: KasbonItem[];
    type: 'REGULAR' | 'OVER_SLOT';
    approvalPath: ApprovalStep[];
    currentStepIndex: number;
    realizationItems?: KasbonItem[];
    realizationTotal?: number;
    isRealized?: boolean;
    slotJustification?: string;
}

export interface SlotRequest {
    id: string;
    requestor: string;
    department: string;
    reason: string;
    currentSlots: number;
    requestedSlots: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    date: string;
    approvalPath: ApprovalStep[];
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    user: string;
    action: string;
    details: string;
    type: 'SLOT' | 'POLICY' | 'KASBON';
}

interface AppContextType {
    currentUser: {
        name: string;
        role: UserRole;
        dept: string;
        atasanLangsung: string;
        isAtasanLangsungActive: boolean;
    };
    setRole: (role: UserRole) => void;
    requests: KasbonRequest[];
    stats: {
        total2026: number;
        avgApproval: string;
        outstanding: number;
    };
    addRequest: (request: Omit<KasbonRequest, 'id' | 'status' | 'isOverdue' | 'slot' | 'approvalPath' | 'currentStepIndex' | 'type'> & { type?: 'REGULAR' | 'OVER_SLOT', slotJustification?: string }) => void;
    matrixConfigs: MatrixConfig[];
    deptSettings: DeptSetting[];
    updateMatrixConfig: (config: MatrixConfig) => void;
    updateDeptSetting: (setting: DeptSetting) => void;
    updateRequest: (request: KasbonRequest) => void;
    revokeRequest: (requestId: string, reason: string) => void;
    slotRequests: SlotRequest[];
    slotMatrix: string[];
    activityLogs: ActivityLog[];
    addSlotRequest: (request: Omit<SlotRequest, 'id' | 'status' | 'date' | 'approvalPath'>) => void;
    updateSlotRequest: (request: SlotRequest) => void;
    updateSlotMatrix: (layers: string[]) => void;
    getDynamicApprovalPath: (amount: number, isOverSlotRequest?: boolean) => ApprovalStep[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [role, setRoleState] = useState<UserRole>('USER');
    const [requests, setRequests] = useState<KasbonRequest[]>([
        {
            id: '00275',
            requestor: 'Fahmi Ilmawan',
            department: 'IT Operation',
            amount: 2000000,
            date: '2026-02-26',
            dateNeeded: '2026-03-01',
            bankAccount: 'BCA - 1234567890',
            status: 'PENDING',
            isOverdue: false,
            slot: 1,
            purpose: 'Beli Server Part',
            items: [
                { id: '1', description: 'Sparepart urgent AC', amount: 1500000 },
                { id: '2', description: 'Transport teknisi', amount: 500000 },
            ],
            type: 'REGULAR',
            approvalPath: [
                { approverName: 'Raymond Tjahja', role: 'Manager IT', status: 'PENDING', stepOrder: 1 },
                { approverName: 'Senior Manager IT', role: 'Sr Manager', status: 'PENDING', stepOrder: 2 },
                { approverName: 'Finance', role: 'Finance', status: 'PENDING', stepOrder: 3 },
            ],
            currentStepIndex: 0
        },
        {
            id: '00261',
            requestor: 'Fahmi Ilmawan',
            department: 'IT Operation',
            amount: 1500000,
            date: '2026-02-15',
            dateNeeded: '2026-02-18',
            bankAccount: 'BCA - 1234567890',
            status: 'APPROVED',
            isOverdue: false,
            slot: 2,
            purpose: 'Modem Router',
            items: [{ id: '1', description: 'Modem Router', amount: 1500000 }],
            approvalPath: [
                { approverName: 'Raymond Tjahja', role: 'Manager IT', status: 'APPROVED', stepOrder: 1 }
            ],
            type: 'REGULAR',
            currentStepIndex: 1
        }
    ]);

    const [slotRequests, setSlotRequests] = useState<SlotRequest[]>([
        {
            id: 'SLOT-001',
            requestor: 'Andi Suherman',
            department: 'Production',
            reason: 'Banyak personil lapangan baru yang butuh operasional cash',
            currentSlots: 2,
            requestedSlots: 3,
            status: 'PENDING',
            date: '2026-02-27',
            approvalPath: [
                { approverName: 'Fahmi Ilmawan', role: 'Dept. Head', status: 'PENDING', stepOrder: 1 }
            ]
        }
    ]);
    const [slotMatrix, setSlotMatrix] = useState<string[]>(['Dept. Head']);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([
        {
            id: 'LOG-001',
            timestamp: new Date().toISOString(),
            user: 'System',
            action: 'Initial Config',
            details: 'Standard slot limit set to 2 for all departments',
            type: 'POLICY'
        }
    ]);

    const addLog = (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
        const newLog: ActivityLog = {
            ...log,
            id: `LOG-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            timestamp: new Date().toISOString()
        };
        setActivityLogs(prev => [newLog, ...prev]);
    };

    const [matrixConfigs, setMatrixConfigs] = useState<MatrixConfig[]>([
        { id: '1', minAmount: 1, maxAmount: 2000000, layers: ['Requestor', 'Dept. Head'] },
        { id: '2', minAmount: 2000001, maxAmount: 5000000, layers: ['Requestor', 'Dept. Head', 'Div. Head'] },
        { id: '3', minAmount: 5000001, maxAmount: 10000000, layers: ['Requestor', 'Dept. Head', 'Div. Head', 'COO'] },
        { id: '4', minAmount: 10000001, maxAmount: null, layers: ['Requestor', 'Dept. Head', 'Div. Head', 'COO', 'Finance'] },
    ]);

    const [deptSettings, setDeptSettings] = useState<DeptSetting[]>([
        { deptId: 'IT', deptName: 'IT Operation', maxSlots: 2, outstandingLimit: 5000000 },
        { deptId: 'MKT', deptName: 'Marketing', maxSlots: 2, outstandingLimit: 3000000 },
    ]);

    const updateMatrixConfig = (config: MatrixConfig) => {
        setMatrixConfigs(prev => prev.map(c => c.id === config.id ? config : c));
    };

    const updateDeptSetting = (setting: DeptSetting) => {
        setDeptSettings(prev => prev.map(s => s.deptId === setting.deptId ? setting : s));
    };

    const updateRequest = (updatedRequest: KasbonRequest) => {
        setRequests(prev => prev.map(req => req.id === updatedRequest.id ? updatedRequest : req));
    };

    const revokeRequest = (requestId: string, reason: string) => {
        setRequests(prev => prev.map(req => {
            if (req.id === requestId) {
                addLog({
                    user: currentUser.name,
                    action: 'Revoked Kasbon',
                    details: `KB: ${requestId} revoked. Reason: ${reason}`,
                    type: 'KASBON'
                });
                return { ...req, status: 'REVOKED' };
            }
            return req;
        }));
    };

    const addSlotRequest = (newSlotReq: Omit<SlotRequest, 'id' | 'status' | 'date' | 'approvalPath'>) => {
        const fullSlotReq: SlotRequest = {
            ...newSlotReq,
            id: `SLOT-00${slotRequests.length + 1}`,
            status: 'PENDING',
            date: new Date().toISOString().split('T')[0],
            approvalPath: slotMatrix.map((layer, idx) => ({
                approverName: layer === 'Dept. Head' ? currentUser.atasanLangsung : (layer === 'Div. Head' ? 'HOD Name' : 'Team Finance'),
                role: layer,
                status: 'PENDING',
                stepOrder: idx + 1
            }))
        };
        setSlotRequests([...slotRequests, fullSlotReq]);
    };

    const updateSlotMatrix = (layers: string[]) => {
        setSlotMatrix(layers);
    };

    const updateSlotRequest = (updatedSlotReq: SlotRequest) => {
        setSlotRequests(prev => prev.map(req => req.id === updatedSlotReq.id ? updatedSlotReq : req));

        // If approved, automatically update department maxSlots
        if (updatedSlotReq.status === 'APPROVED') {
            const dept = deptSettings.find(d => d.deptName === updatedSlotReq.department);
            if (dept) {
                updateDeptSetting({ ...dept, maxSlots: updatedSlotReq.requestedSlots });
                addLog({
                    user: currentUser.name,
                    action: 'Approved Slot Exception',
                    details: `Dept: ${updatedSlotReq.department} | ${updatedSlotReq.currentSlots} -> ${updatedSlotReq.requestedSlots} Slots`,
                    type: 'SLOT'
                });
            }
        } else if (updatedSlotReq.status === 'REJECTED') {
            addLog({
                user: currentUser.name,
                action: 'Rejected Slot Exception',
                details: `Request ${updatedSlotReq.id} by ${updatedSlotReq.requestor} was rejected`,
                type: 'SLOT'
            });
        }
    };

    const currentUser = {
        name: 'Fahmi Ilmawan',
        role,
        dept: 'IT Operation',
        atasanLangsung: 'Raymond Tjahja',
        isAtasanLangsungActive: false // MOCK: Atasan Resigned for showing Warning in UI
    };

    const getDynamicApprovalPath = (amount: number, isOverSlotRequest?: boolean): ApprovalStep[] => {
        const config = matrixConfigs.find(c =>
            amount >= c.minAmount && (c.maxAmount === null || amount <= c.maxAmount)
        ) || matrixConfigs[0];

        const steps: ApprovalStep[] = [];

        // Steps strictly from Matrix
        config.layers.forEach((layer) => {
            let approverName = layer;
            let status: 'PENDING' | 'APPROVED' = 'PENDING';

            // Map roles to actual names (Mock)
            if (layer === 'Requestor') {
                approverName = currentUser.name;
                status = 'APPROVED';
            }
            if (layer === 'Dept. Head') approverName = 'Raymond Tjahja';
            if (layer === 'Div. Head') approverName = 'HOD Name';
            let roleDisplay = layer;

            // If it's an over-slot request, mark the Dept Head step specially
            if (isOverSlotRequest && layer === 'Dept. Head') {
                roleDisplay = 'Dept. Head (Slot Approval)';
            }

            steps.push({
                approverName,
                role: roleDisplay,
                status,
                stepOrder: steps.length + 1,
                approvedAt: status === 'APPROVED' ? new Date().toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : undefined
            });
        });

        // Add Finance at the end IF NOT in matrix and if it's the 10jt+ tier (backup logic)
        // But user wants it in the layers, so we rely on matrix.
        // For safety, if Finance is missing from all tiers, we can add it here.
        if (amount > 10000000 && !config.layers.includes('Finance')) {
            steps.push({
                approverName: 'Admin Finance',
                role: 'Finance',
                status: 'PENDING',
                stepOrder: steps.length + 1
            });
        }

        return steps;
    };

    const setRole = (newRole: UserRole) => setRoleState(newRole);

    const stats = {
        total2026: 12000000,
        avgApproval: '1.2 hari',
        outstanding: requests.filter(r => r.status !== 'SETTLED').reduce((acc, r) => acc + r.amount, 0)
    };

    const addRequest = (newReq: Omit<KasbonRequest, 'id' | 'status' | 'isOverdue' | 'slot' | 'approvalPath' | 'currentStepIndex' | 'type'> & { type?: 'REGULAR' | 'OVER_SLOT' }) => {
        const activeRequests = requests.filter(r => r.requestor === newReq.requestor && r.status !== 'SETTLED');
        const nextSlot = activeRequests.length + 1;
        const dept = deptSettings.find(d => d.deptName === newReq.department);
        const isOverLimit = dept ? nextSlot > dept.maxSlots : nextSlot > 2;

        const fullReq: KasbonRequest = {
            ...newReq,
            id: `00${275 + requests.length + 1}`,
            status: 'PENDING',
            isOverdue: false,
            slot: nextSlot,
            type: newReq.type || (isOverLimit ? 'OVER_SLOT' : 'REGULAR'),
            approvalPath: getDynamicApprovalPath(newReq.amount, isOverLimit),
            currentStepIndex: 0,
        };
        setRequests([...requests, fullReq]);
    };

    return (
        <AppContext.Provider value={{
            currentUser,
            setRole,
            requests,
            stats,
            addRequest,
            matrixConfigs,
            deptSettings,
            updateMatrixConfig,
            updateDeptSetting,
            updateRequest,
            revokeRequest,
            slotRequests,
            slotMatrix,
            activityLogs,
            addSlotRequest,
            updateSlotRequest,
            updateSlotMatrix,
            getDynamicApprovalPath
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useApp must be used within AppProvider');
    return context;
};
