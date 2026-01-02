export const AUTH_TOKEN = 'nearnow_token';
export const AUTH_USER_ID = 'nearnow_user_id';

export const setToken = (token: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_TOKEN, token);
    }
};

export const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(AUTH_TOKEN);
    }
    return null;
};

export const setUserId = (id: string) => {
    if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_USER_ID, id);
    }
};

export const getUserId = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(AUTH_USER_ID);
    }
    return null;
};

export const removeUserId = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_USER_ID);
    }
};

export const removeToken = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(AUTH_TOKEN);
        removeUserId();
    }
};

export const logout = () => {
    removeToken();
    if (typeof window !== 'undefined') {
        window.location.href = '/login';
    }
};
