export enum Role {
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
}

export interface User {
    id: string;
    email?: string;
    name?: string;
    role?: Role;
    avatar?: string;
    reputation?: number;
    neighborhood?: {
        id: string;
        name: string;
    };
    createdAt?: string;
}
