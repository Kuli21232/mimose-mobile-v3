import client from './client';

export const authApi = {
  register: (email, password, handle) =>
    client.post('/api/v3/auth/register', { email, password, handle }),

  login: (email, password) =>
    client.post('/api/v3/auth/login', { email, password }),

  refresh: (refreshToken) =>
    client.post('/api/v3/auth/refresh', { refreshToken }),

  logout: () =>
    client.post('/api/v3/auth/logout'),

  checkHandle: (handle) =>
    client.get(`/api/v3/auth/check-handle/${handle}`),

  verifyEmail: (email, code) =>
    client.post('/api/v3/auth/verify-email/confirm', { email, code }),

  resendVerification: (email) =>
    client.post('/api/v3/auth/verify-email/resend', { email }),

  requestPasswordReset: (email) =>
    client.post('/api/v3/auth/reset-password/request', { email }),

  verifyPasswordReset: (email, code) =>
    client.post('/api/v3/auth/reset-password/verify', { email, code }),

  completePasswordReset: (email, code, newPassword) =>
    client.post('/api/v3/auth/reset-password/complete', { email, code, newPassword }),
};
