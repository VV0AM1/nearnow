export interface User {
    id: string;
    email?: string;
    name?: string;
    avatar?: string;
    reputation?: number;
    neighborhood?: {
        id: string;
        name: string;
    };
    createdAt?: string;
}
