export const auth = {
  getToken: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null,

  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },

  clear: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  isAuthenticated: (): boolean =>
    typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
};
