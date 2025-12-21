// Debugging Production Build Variables
console.log('[Config] API_URL Raw:', process.env.NEXT_PUBLIC_API_URL);
console.log('[Config] API_URL Final:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002');

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3002';
