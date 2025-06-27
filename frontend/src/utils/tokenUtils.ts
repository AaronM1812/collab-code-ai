// Token utility functions for JWT management

interface JWTPayload {
  userId: string;
  username: string;
  exp: number;
  iat: number;
}

// Decode JWT token without verification (for client-side expiration check)
export const decodeToken = (token: string): JWTPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  // Add 5 minute buffer before expiration
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() >= (decoded.exp * 1000) - bufferTime;
};

// Check if token will expire soon (within 10 minutes)
export const isTokenExpiringSoon = (token: string): boolean => {
  const decoded = decodeToken(token);
  if (!decoded) return true;
  
  const bufferTime = 10 * 60 * 1000; // 10 minutes in milliseconds
  return Date.now() >= (decoded.exp * 1000) - bufferTime;
};

// Get time until token expires (in milliseconds)
export const getTimeUntilExpiration = (token: string): number => {
  const decoded = decodeToken(token);
  if (!decoded) return 0;
  
  return (decoded.exp * 1000) - Date.now();
};

// Get user info from token
export const getUserFromToken = (token: string): { userId: string; username: string } | null => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    userId: decoded.userId,
    username: decoded.username
  };
}; 