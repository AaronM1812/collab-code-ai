import { useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { isTokenExpiringSoon, getTimeUntilExpiration } from '../utils/tokenUtils';

interface TokenRefreshProps {
  onTokenRefresh?: () => void;
  onTokenExpired?: () => void;
}

const TokenRefresh: React.FC<TokenRefreshProps> = ({ onTokenRefresh, onTokenExpired }) => {
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleTokenRefresh = () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      if (onTokenExpired) onTokenExpired();
      return;
    }

    // Clear existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }

    // Check if token is expiring soon
    if (isTokenExpiringSoon(accessToken)) {
      // Refresh immediately if expiring soon
      refreshToken();
    } else {
      // Schedule refresh 5 minutes before expiration
      const timeUntilExpiration = getTimeUntilExpiration(accessToken);
      const refreshTime = Math.max(timeUntilExpiration - (5 * 60 * 1000), 60000); // At least 1 minute

      refreshTimerRef.current = setTimeout(() => {
        refreshToken();
      }, refreshTime);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        if (onTokenExpired) onTokenExpired();
        return;
      }

      // Call the refresh endpoint directly
      const response = await fetch('http://localhost:3001/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        
        if (onTokenRefresh) onTokenRefresh();
        
        // Schedule next refresh
        scheduleTokenRefresh();
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      if (onTokenExpired) onTokenExpired();
    }
  };

  useEffect(() => {
    scheduleTokenRefresh();

    // Set up periodic check every minute
    const intervalId = setInterval(() => {
      scheduleTokenRefresh();
    }, 60000); // Check every minute

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      clearInterval(intervalId);
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default TokenRefresh; 