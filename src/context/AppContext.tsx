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
}

export interface KasbonRequest {
    id: string;
    requestor: string;
    department: string;
    amount: number;
    date: string;
    dateNeeded: string;
    bankAccount: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISBURSED' | 'SETTLED';
    isOverdue: boolean;
    slot: number;
    purpose: string;
    items: KasbonItem[];
    approvalPath: ApprovalStep[];
    currentStepIndex: number;
}

interface AppContextType {
    currentUser: {
        name: string;
        role: UserRole;
        dept: string;
        supervisor: string;
        isSupervisorActive: boolean;
    };
    setRole: (role: UserRole) => void;
    requests: KasbonRequest[];
    stats: {
        total2026: number;
        avgApproval: string;
        outstanding: number;
    };
    addRequest: (request: Omit<KasbonRequest, 'id' | 'status' | 'isOverdue' | 'slot' | 'approvalPath' | 'currentStepIndex'>) => void;
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
            currentStepIndex: 1
        }
    ]);

    const setRole = (newRole: UserRole) => setRoleState(newRole);

    const stats = {
        total2026: 12000000,
        avgApproval: '1.2 hari',
        outstanding: requests.filter(r => r.status !== 'SETTLED').reduce((acc, r) => acc + r.amount, 0)
    };

    const addRequest = (newReq: Omit<KasbonRequest, 'id' | 'status' | 'isOverdue' | 'slot' | 'approvalPath' | 'currentStepIndex'>) => {
        const activeRequests = requests.filter(r => r.requestor === newReq.requestor && r.status !== 'SETTLED');
        const nextSlot = activeRequests.length + 1;

        const fullReq: KasbonRequest = {
            ...newReq,
            id: `00${275 + requests.length + 1}`,
            status: 'PENDING',
            isOverdue: false,
            slot: nextSlot,
            approvalPath: [
                { approverName: 'Raymond Tjahja', role: 'Manager IT', status: 'PENDING', stepOrder: 1 },
                {
                    approverName: nextSlot === 3 ? 'Director IT' : 'Senior Manager IT',
                    role: nextSlot === 3 ? 'Director (Slot 3)' : 'Sr Manager',
                    status: 'PENDING',
                    stepOrder: 2
                },
                { approverName: 'Finance', role: 'Finance', status: 'PENDING', stepOrder: 3 },
            ],
            currentStepIndex: 0,
        };
        setRequests([...requests, fullReq]);
    };

    return (
        <AppContext.Provider value={{
            currentUser: {
                name: 'Fahmi Ilmawan',
                role,
                dept: 'IT Operation',
                supervisor: 'Raymond Tjahja',
                isSupervisorActive: false // MOCK: Supervisor Resigned for showing Warning in UI
            },
            setRole,
            requests,
            stats,
            addRequest
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
