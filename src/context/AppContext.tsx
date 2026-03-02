import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import Swal from 'sweetalert2';
import { supabase } from '../supabaseClient';

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
    approvedBy?: string; // Nama asli orang yang approve (asisten)
    remarks?: string;
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
    bankName: string;
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
        assistantFor: string[]; // List nama boss yang dia pegang
    };
    setRole: (role: UserRole) => void;
    requests: KasbonRequest[];
    stats: {
        totalYear: number;
        avgApproval: string;
        outstanding: number;
    };
    addRequest: (request: Omit<KasbonRequest, 'id' | 'status' | 'isOverdue' | 'slot' | 'approvalPath' | 'currentStepIndex' | 'type'> & { type?: 'REGULAR' | 'OVER_SLOT', slotJustification?: string }) => void;
    matrixConfigs: MatrixConfig[];
    deptSettings: DeptSetting[];
    updateMatrixConfig: (config: MatrixConfig) => void;
    saveMatrixConfig: (config: MatrixConfig) => Promise<void>;
    updateDeptSetting: (setting: DeptSetting) => void;
    updateRequest: (request: KasbonRequest, remarks?: string) => void;
    revokeRequest: (requestId: string, reason: string) => void;
    slotRequests: SlotRequest[];
    slotMatrix: string[];
    activityLogs: ActivityLog[];
    addSlotRequest: (request: Omit<SlotRequest, 'id' | 'status' | 'date' | 'approvalPath'>) => void;
    updateSlotRequest: (request: SlotRequest) => void;
    updateSlotMatrix: (layers: string[]) => void;
    getDynamicApprovalPath: (amount: number, isOverSlotRequest?: boolean) => ApprovalStep[];
    addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
    extractDeptName: (userStr: any) => string;
    extractCCCode: (userStr: any) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [role, setRoleState] = useState<UserRole>('USER');
    const [requests, setRequests] = useState<KasbonRequest[]>([]);
    const [assistantForNames, setAssistantForNames] = useState<string[]>([]);
    const [deptSettings, setDeptSettings] = useState<DeptSetting[]>([]);
    const [slotRequests, setSlotRequests] = useState<SlotRequest[]>([]);
    const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
    const [slotMatrix, setSlotMatrix] = useState<string[]>(['Dept. Head']);
    const [orgChain, setOrgChain] = useState<any[]>([]);
    const [matrixConfigs, setMatrixConfigs] = useState<MatrixConfig[]>([
        { id: '1', minAmount: 1, maxAmount: 5000000, layers: ['Requestor', 'Dept Senior Manager'] },
        { id: '2', minAmount: 5000001, maxAmount: 10000000, layers: ['Requestor', 'Dept Senior Manager', 'Vice President'] },
        { id: '3', minAmount: 10000001, maxAmount: 30000000, layers: ['Requestor', 'Dept Senior Manager', 'Vice President', 'Executive Vice President'] },
        { id: '4', minAmount: 30000001, maxAmount: null, layers: ['Requestor', 'Dept Senior Manager', 'Vice President', 'Executive Vice President', 'Chief Operating Officer'] },
    ]);
    const [financeUsers, setFinanceUsers] = useState<any[]>([]);

    const userStr = typeof window !== 'undefined' ? localStorage.getItem('kasbon_user') : null;
    const loggedInUser = useMemo(() => userStr ? JSON.parse(userStr) : null, [userStr]);

    useEffect(() => {
        const fetchProxies = async () => {
            if (!loggedInUser || (!loggedInUser.emp_no && !loggedInUser.employee_id)) return;
            const myId = loggedInUser.employee_id || loggedInUser.emp_no;

            try {
                const { data: proxies } = await supabase
                    .from('user_proxies')
                    .select('boss_employee_id')
                    .eq('assistant_employee_id', myId);

                if (proxies && proxies.length > 0) {
                    const bossIds = proxies.map(p => p.boss_employee_id);
                    const res = await fetch('http://localhost:3001/api/users/me');
                    const allUsersResult = await res.json();
                    if (allUsersResult.status === 'success') {
                        const bossNames = allUsersResult.data
                            .filter((u: any) => bossIds.includes(u.employee_id))
                            .map((u: any) => u.employe_name);
                        setAssistantForNames(bossNames);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch proxies:', err);
            }
        };
        fetchProxies();
    }, [loggedInUser]);

    const extractDeptName = (userStr: any) => {
        if (!userStr) return 'IT Operation';

        // Try to match with deptSettings first for clean mapping
        const ccCode = userStr.cost_center || userStr.organization_unit || '';
        const match = deptSettings.find(d => d.deptId === ccCode);
        if (match) return match.deptName;

        // Try to use department or org unit over raw cc code
        const rawDept = userStr.department || userStr.organization_unit;

        if (userStr.cost_center) {
            const parts = userStr.cost_center.trim().split(/\s+/);
            if (parts.length > 1) {
                return parts.slice(1).join(' '); // removes the 'CB018-CC028' prefix if present
            }
            if (rawDept && rawDept !== userStr.cost_center) {
                return rawDept; // return department if cost center is only the code
            }
            return userStr.cost_center;
        }
        return rawDept || 'Unknown Dept';
    };

    const extractCCCode = (userStr: any) => {
        if (!userStr) return 'HO-MOLOGIZ';
        const rawCC = userStr.cost_center || userStr.organization_unit || 'UNKNOWN-CC';
        const ccMatch = rawCC.trim().match(/^(?:\d{6,7}-)?([A-Z0-9]+-[A-Z0-9]+)(\s+|$)/i);
        return ccMatch ? ccMatch[1] : rawCC.trim();
    };

    const currentUser = useMemo(() => ({
        name: loggedInUser?.name || 'Fahmi Ilmawan',
        role,
        dept: extractDeptName(loggedInUser),
        atasanLangsung: loggedInUser?.direct_supervisor || 'Raymond Tjahja',
        isAtasanLangsungActive: (!loggedInUser || loggedInUser?.direct_supervisor) ? true : false,
        assistantFor: assistantForNames
    }), [loggedInUser, role, deptSettings, assistantForNames]);

    // Add extra tools manually for UI
    const tools = useMemo(() => ({ extractDeptName, extractCCCode }), [deptSettings])

    const fetchKasbons = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/kasbons');
            const result = await res.json();
            if (result.status === 'success') {
                const mappedKasbons: KasbonRequest[] = result.data.map((dbKasbon: any) => ({
                    id: dbKasbon.id,
                    requestor: dbKasbon.requestor_name,
                    department: dbKasbon.department_name,
                    amount: dbKasbon.amount,
                    date: dbKasbon.request_date.split('T')[0],
                    dateNeeded: dbKasbon.date_needed,
                    bankName: dbKasbon.bank_name || 'BCA',
                    bankAccount: dbKasbon.bank_account,
                    status: dbKasbon.status,
                    isOverdue: dbKasbon.is_overdue,
                    slot: dbKasbon.slot_used,
                    purpose: dbKasbon.purpose,
                    items: dbKasbon.items
                        ? dbKasbon.items.filter((i: any) => !i.is_realization_item).map((i: any) => ({ id: i.id, description: i.description, amount: i.amount }))
                        : [],
                    realizationItems: dbKasbon.items
                        ? dbKasbon.items.filter((i: any) => i.is_realization_item).map((i: any) => ({ id: i.id, description: i.description, amount: i.amount }))
                        : undefined,
                    type: dbKasbon.type,
                    approvalPath: dbKasbon.approvals
                        ? dbKasbon.approvals.sort((a: any, b: any) => a.step_order - b.step_order).map((a: any) => ({
                            approverName: a.approver_name,
                            role: a.role_description,
                            status: a.status,
                            stepOrder: a.step_order,
                            approvedAt: a.approved_at,
                            remarks: a.remarks
                        }))
                        : [],
                    currentStepIndex: dbKasbon.current_step_index,
                    realizationTotal: dbKasbon.realization_total,
                    isRealized: dbKasbon.is_realized,
                    slotJustification: dbKasbon.slot_justification
                }));
                setRequests(mappedKasbons);
            }
        } catch (error) {
            console.error('Failed to fetch kasbons:', error);
        }
    };

    useEffect(() => {
        fetchKasbons();
        fetchSlotRequests();
        fetchDeptSettings();
        fetchApprovalMatrix();
        fetchFinanceUsers();
        fetchOrgChain();
        fetchActivityLogs();
        fetchSlotMatrix();
    }, []);




    const fetchSlotRequests = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/slot-requests');
            const json = await res.json();
            if (json.status === 'success' && json.data) {
                const mappedSlots = json.data.map((ds: any) => ({
                    id: ds.id,
                    requestor: ds.requestor_name,
                    department: ds.department_name,
                    reason: ds.reason,
                    currentSlots: ds.current_slots,
                    requestedSlots: ds.requested_slots,
                    status: ds.status,
                    date: ds.date,
                    approvalPath: ds.approvals ? ds.approvals.sort((a: any, b: any) => a.step_order - b.step_order).map((a: any) => ({
                        approverName: a.approver_name,
                        role: a.role_description,
                        status: a.status,
                        stepOrder: a.step_order,
                        approvedAt: a.approved_at
                    })) : []
                }));
                setSlotRequests(mappedSlots);
            }
        } catch (error) {
            console.error('Failed to fetch slot requests:', error);
        }
    };


    const fetchActivityLogs = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/activity-logs');
            const json = await res.json();
            if (json.status === 'success' && json.data) {
                setActivityLogs(json.data.map((l: any) => ({
                    id: l.id,
                    timestamp: l.timestamp,
                    user: l.user,
                    action: l.action,
                    details: l.details,
                    type: l.type
                })));
            }
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
        }
    };

    const fetchSlotMatrix = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/settings/slot_exception_workflow');
            const json = await res.json();
            if (json.status === 'success' && json.data) {
                setSlotMatrix(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch slot matrix:', err);
        }
    };

    const addLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
        try {
            const res = await fetch('http://localhost:3001/api/activity-logs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(log)
            });
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            if (data.status === 'success') {
                setActivityLogs(prev => [data.data, ...prev]);
            }
        } catch (err) {
            console.error('Failed to add log:', err);
        }
    };

    // ===== APPROVAL MATRIX (from DB) =====


    const fetchApprovalMatrix = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/approval-matrix');
            const json = await res.json();
            if (json.status === 'success' && json.data?.length > 0) {
                setMatrixConfigs(json.data.map((d: any) => ({
                    id: d.id,
                    minAmount: d.min_amount,
                    maxAmount: d.max_amount,
                    layers: d.layers || [],
                })));
            }
        } catch (err) {
            console.error('Failed to fetch approval matrix:', err);
        }
    };

    // ===== ORG CHAIN (from Modena Identity) =====


    const fetchOrgChain = async () => {
        try {
            const userStr = localStorage.getItem('kasbon_user');
            const user = userStr ? JSON.parse(userStr) : null;
            if (!user?.emp_no) return;

            const res = await fetch(`http://localhost:3001/api/org-chain/${user.emp_no}`);
            const json = await res.json();
            if (json.status === 'success') {
                setOrgChain(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch org chain:', err);
        }
    };

    // ===== FINANCE USERS (from user_roles + modena identity) =====


    const fetchFinanceUsers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/role-users/FINANCE');
            const json = await res.json();
            if (json.status === 'success' && json.data?.length > 0) {
                setFinanceUsers(json.data);
            }
        } catch (err) {
            console.error('Failed to fetch finance users:', err);
        }
    };

    // Fetch on mount
    useEffect(() => {
        fetchApprovalMatrix();
        fetchFinanceUsers();
        fetchOrgChain();
    }, []);

    // Re-fetch orgChain when localStorage changes (i.e. after login)
    useEffect(() => {
        const checkAndFetch = () => {
            const userStr = localStorage.getItem('kasbon_user');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    if (user?.emp_no && orgChain.length === 0) {
                        fetchOrgChain();
                        fetchFinanceUsers();
                    }
                } catch { /* ignore */ }
            }
        };

        // Poll every 2 seconds to catch login state
        const interval = setInterval(checkAndFetch, 2000);
        // Also listen for storage events (cross-tab)
        window.addEventListener('storage', checkAndFetch);

        return () => {
            clearInterval(interval);
            window.removeEventListener('storage', checkAndFetch);
        };
    }, [orgChain.length]);



    const fetchDeptSettings = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/departments');
            const json = await res.json();
            if (json.status === 'success' && json.data) {
                const mapped = json.data.map((d: any) => ({
                    deptId: d.code,
                    deptName: d.name,
                    maxSlots: d.max_slots,
                    outstandingLimit: d.outstanding_limit
                }));
                setDeptSettings(mapped);
            }
        } catch (err) {
            console.error('Failed to fetch dept settings:', err);
        }
    };

    const updateMatrixConfig = (config: MatrixConfig) => {
        setMatrixConfigs(prev => prev.map(c => c.id === config.id ? config : c));
    };

    const saveMatrixConfig = async (config: MatrixConfig) => {
        // Save to DB
        try {
            const res = await fetch(`http://localhost:3001/api/approval-matrix/${config.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    min_amount: config.minAmount,
                    max_amount: config.maxAmount,
                    layers: config.layers,
                }),
            });

            const data = await res.json();

            if (data.status === 'success') {
                Swal.fire({
                    icon: 'success',
                    title: 'Berhasil Disimpan',
                    text: 'Konfigurasi layer persetujuan telah diperbarui di database.',
                    confirmButtonColor: '#796cf2'
                });

                addLog({
                    user: currentUser.name,
                    action: 'Update Matrix',
                    details: `Updated range Rp ${config.minAmount.toLocaleString()} - ${config.maxAmount ? config.maxAmount.toLocaleString() : '∞'}`,
                    type: 'POLICY'
                });
            } else {
                throw new Error(data.message || 'Failed to save');
            }
        } catch (err) {
            console.error('Failed to update matrix config:', err);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan',
                text: 'Terjadi kesalahan saat menyimpan perubahan ke database.'
            });
        }
    };

    const updateDeptSetting = (setting: DeptSetting) => {
        setDeptSettings(prev => prev.map(s => s.deptId === setting.deptId ? setting : s));
    };

    const updateRequest = async (updatedRequest: KasbonRequest, remarks?: string) => {
        try {
            await fetch(`http://localhost:3001/api/kasbons/${updatedRequest.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: updatedRequest.status,
                    approver_name: currentUser.name,
                    remarks: remarks,
                    isRealized: updatedRequest.isRealized,
                    realizationItems: updatedRequest.realizationItems,
                    realizationTotal: updatedRequest.realizationTotal
                })
            });
            await fetchKasbons(); // Refresh global list
            fetchDeptSettings(); // Refresh settings just in case something reverted (like slots)
        } catch (error) {
            console.error('Failed to update request:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal update status kasbon' });
        }
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

    const addSlotRequest = async (newSlotReq: Omit<SlotRequest, 'id' | 'status' | 'date' | 'approvalPath'>) => {
        try {
            const approvalPath = slotMatrix.map((layer, idx) => ({
                approverName: layer === 'Dept. Head' ? currentUser.atasanLangsung : (layer === 'Div. Head' ? 'Sr. Manager Name' : 'Finance Team'),
                role: layer,
                status: 'PENDING',
                stepOrder: idx + 1
            }));

            const res = await fetch('http://localhost:3001/api/slot-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestor_emp_no: loggedInUser?.emp_no,
                    requestor_name: currentUser.name,
                    department_name: currentUser.dept,
                    cost_center_code: extractCCCode(loggedInUser),
                    reason: newSlotReq.reason,
                    current_slots: newSlotReq.currentSlots,
                    requested_slots: newSlotReq.requestedSlots,
                    approvalPath: approvalPath
                })
            });

            if (res.ok) {
                fetchSlotRequests();
                addLog({
                    user: currentUser.name,
                    action: 'Request Extra Slot',
                    details: `Requested ${newSlotReq.requestedSlots} slots for ${currentUser.dept}`,
                    type: 'SLOT'
                });
            }
        } catch (error) {
            console.error('Failed to add slot request:', error);
        }
    };

    const updateSlotMatrix = async (layers: string[]) => {
        try {
            setSlotMatrix(layers);
            const res = await fetch('http://localhost:3001/api/settings/slot_exception_workflow', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: layers })
            });

            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            addLog({
                user: currentUser.name,
                action: 'Update Slot Policy',
                details: `Updated workflow to: ${layers.join(' → ')}`,
                type: 'POLICY'
            });
        } catch (err) {
            console.error('Failed to save slot matrix:', err);
            throw err;
        }
    };

    const updateSlotRequest = async (updatedSlotReq: SlotRequest) => {
        try {
            const res = await fetch(`http://localhost:3001/api/slot-requests/${updatedSlotReq.id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: updatedSlotReq.status,
                    approver_name: currentUser.name // Current user is the one approving/rejecting
                })
            });

            if (res.ok) {
                fetchSlotRequests();

                if (updatedSlotReq.status === 'APPROVED') {
                    addLog({
                        user: currentUser.name,
                        action: 'Approved Slot Exception',
                        details: `Dept: ${updatedSlotReq.department} | Updated to ${updatedSlotReq.requestedSlots} Slots`,
                        type: 'SLOT'
                    });
                    // Refresh department settings too
                    fetchDeptSettings();
                } else if (updatedSlotReq.status === 'REJECTED') {
                    addLog({
                        user: currentUser.name,
                        action: 'Rejected Slot Exception',
                        details: `Request ${updatedSlotReq.id} by ${updatedSlotReq.requestor} was rejected`,
                        type: 'SLOT'
                    });
                }
            }
        } catch (error) {
            console.error('Failed to update slot request:', error);
        }
    };


    const getDynamicApprovalPath = (amount: number, isOverSlotRequest?: boolean): ApprovalStep[] => {
        const config = matrixConfigs.find(c =>
            amount >= c.minAmount && (c.maxAmount === null || amount <= c.maxAmount)
        ) || matrixConfigs[0];

        const steps: ApprovalStep[] = [];

        // orgChain is ordered from TOP (CEO) → BOTTOM (you)
        // So the last element is the requestor, second-to-last is Dept. Head, etc.
        const chainLen = orgChain.length;
        const selfIdx = chainLen - 1; // Index of requestor (YOU) in chain

        // Helper: resolve a person from the chain by offset from the requestor
        const getChainPerson = (levelsUp: number): any => {
            const idx = selfIdx - levelsUp;
            if (idx >= 0 && idx < chainLen) {
                return orgChain[idx];
            }
            return null;
        };

        // Map layer roles to real names & titles from orgChain
        const resolveApprover = (layer: string): { name: string, role: string } => {
            let person: any = null;
            let roleDisplay = layer;
            if (isOverSlotRequest && layer === 'Dept Senior Manager') {
                roleDisplay = 'Dept Senior Manager (Slot Approval)';
            }

            switch (layer) {
                case 'Requestor':
                    return { name: currentUser.name, role: 'Requestor' };
                case 'Dept Senior Manager':
                    person = getChainPerson(1);
                    break;
                case 'Vice President':
                    person = getChainPerson(2);
                    break;
                case 'Executive Vice President':
                    person = getChainPerson(3);
                    break;
                case 'Chief Operating Officer':
                    person = getChainPerson(4) || getChainPerson(3); // Fallback to highest available if COO empty
                    break;
                case 'Finance':
                    return {
                        name: financeUsers.length > 0 ? financeUsers[0].employe_name : 'Finance Team',
                        role: 'Finance'
                    };
                default:
                    return { name: layer, role: roleDisplay };
            }

            if (person) {
                return {
                    name: person.employe_name || person.direct_supervisor || person.name || 'Unknown',
                    // Use actual position if available, fallback to the matrix role name
                    role: person.position || person.role_description || roleDisplay
                };
            }

            return { name: 'To Be Decided', role: roleDisplay };
        };

        config.layers.forEach((layer) => {
            const { name, role } = resolveApprover(layer);

            // DEDUPLICATION: Don't add if the same person is already the previous step
            if (steps.length > 0 && steps[steps.length - 1].approverName === name) {
                return;
            }

            let status: 'PENDING' | 'APPROVED' = 'PENDING';
            if (layer === 'Requestor') status = 'APPROVED';

            steps.push({
                approverName: name,
                role: role,
                status,
                stepOrder: steps.length + 1,
                approvedAt: status === 'APPROVED' ? new Date().toISOString() : undefined
            });
        });

        // ALWAYS add Finance as the final milestone for all kasbons (Disbursement)
        if (!steps.find(s => s.role === 'Finance')) {
            const finance = resolveApprover('Finance');
            steps.push({
                approverName: finance.name,
                role: finance.role,
                status: 'PENDING',
                stepOrder: steps.length + 1
            });
        }

        return steps;
    };

    const setRole = (newRole: UserRole) => setRoleState(newRole);

    const currentYear = new Date().getFullYear().toString();
    const myRequests = requests.filter(r => r.requestor === currentUser.name);

    const stats = {
        totalYear: myRequests
            .filter(r => r.date.startsWith(currentYear) && !['REJECTED', 'REVOKED'].includes(r.status))
            .reduce((acc, r) => acc + r.amount, 0),
        avgApproval: '1.2 hari',
        outstanding: myRequests
            .filter(r => !['SETTLED', 'REJECTED', 'REVOKED'].includes(r.status))
            .reduce((acc, r) => acc + r.amount, 0)
    };

    const addRequest = async (newReq: Omit<KasbonRequest, 'id' | 'status' | 'isOverdue' | 'slot' | 'approvalPath' | 'currentStepIndex' | 'type'> & { type?: 'REGULAR' | 'OVER_SLOT' }) => {
        const userStr = localStorage.getItem('kasbon_user');
        const loggedUser = userStr ? JSON.parse(userStr) : null;

        const emp_no = loggedUser?.emp_no || 'NIP-UNKNOWN';
        const name = loggedUser?.name || currentUser.name;

        const costCenter = extractCCCode(loggedUser);

        const activeRequests = requests.filter(r => r.requestor === name && r.status !== 'SETTLED');
        const nextSlot = activeRequests.length + 1;
        const isOverLimit = nextSlot > 2;

        const payload = {
            requestor_emp_no: emp_no,
            requestor_name: name,
            department_name: newReq.department,
            cost_center_code: costCenter,
            amount: newReq.amount,
            date_needed: newReq.dateNeeded,
            bank_name: newReq.bankName,
            bank_account: newReq.bankAccount,
            purpose: newReq.purpose,
            items: newReq.items,
            slot_used: nextSlot,
            type: newReq.type || (isOverLimit ? 'OVER_SLOT' : 'REGULAR'),
            approvalPath: getDynamicApprovalPath(newReq.amount, isOverLimit),
            slot_justification: newReq.slotJustification
        };

        try {
            const res = await fetch('http://localhost:3001/api/kasbons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                await fetchKasbons(); // Refresh data after save
                return data.data;
            } else {
                throw new Error(data.message || 'Gagal menyimpan kasbon');
            }
        } catch (error) {
            console.error('Error saving kasbon:', error);
            throw error; // Re-throw for UI catch
        }
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
            saveMatrixConfig,
            updateDeptSetting,
            updateRequest,
            revokeRequest,
            slotRequests,
            slotMatrix,
            activityLogs,
            addSlotRequest,
            updateSlotRequest,
            updateSlotMatrix,
            getDynamicApprovalPath,
            addLog,
            extractDeptName: tools.extractDeptName,
            extractCCCode: tools.extractCCCode
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
