export interface UserInfo {
  id: string;
  role: 'Admin' | 'Agent' | 'Requester' | string;
  email: string;
}

function decodeToken(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(part));
  } catch {
    return null;
  }
}

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

  // Decodes the JWT payload to extract id, role, email — no network call needed
  getUserInfo: (): UserInfo | null => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return null;
    const payload = decodeToken(token);
    if (!payload) return null;

    const id    = (payload['sub'] as string) ?? '';
    // .NET maps ClaimTypes.Role to 'role' in the outbound JWT
    const role  = (payload['role']
      ?? payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      ?? '') as string;
    const email = (payload['email']
      ?? payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress']
      ?? '') as string;

    return { id, role, email };
  },
};
