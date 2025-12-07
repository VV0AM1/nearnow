import Cookies from 'js-cookie';

export const AUTH_TOKEN = 'nearnow_token';

export const setToken = (token: string) => {
    Cookies.set(AUTH_TOKEN, token, { expires: 7 }); // 7 days
};

export const getToken = () => {
    return Cookies.get(AUTH_TOKEN);
};

export const AUTH_USER_ID = 'nearnow_user_id';

export const setUserId = (id: string) => {
    Cookies.set(AUTH_USER_ID, id, { expires: 7 });
};

export const getUserId = () => {
    return Cookies.get(AUTH_USER_ID);
};

export const removeUserId = () => {
    Cookies.remove(AUTH_USER_ID);
};

export const removeToken = () => {
    Cookies.remove(AUTH_TOKEN);
    removeUserId();
};

export const logout = () => {
    removeToken();
    window.location.href = '/login';
}
