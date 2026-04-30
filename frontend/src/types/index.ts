export type Role = 'SELLER' | 'ADMIN' | 'CUSTOMER';

export type Status =
    | 'CREATED'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'IN_TRANSIT'
    | 'DELIVERED'
    | 'CANCELLED';

export interface AuthUser {
    id: string;
    email: string;
    role: Role;
}

export interface Item {
    id: string;
    trackingCode: string;
    title: string;
    description?: string;
    currentStatus: Status;
    createdAt: string;
    updatedAt: string;
}

export interface StatusHistoryEntry {
    id: string;
    oldStatus: Status;
    newStatus: Status;
    changedAt: string;
}

export interface TrackResult {
    trackingCode: string;
    title: string;
    currentStatus: Status;
    createdAt: string;
    updatedAt: string;
    statusHistory: StatusHistoryEntry[];
}
export interface ApiResponse<T = undefined> {
    success: boolean;
    data?: T;
    message?: string;
    errors?: unknown[];
}