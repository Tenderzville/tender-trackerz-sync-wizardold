
import { useState, useEffect } from 'react';

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  company?: string;
  phoneNumber?: string;
  location?: string;
  businessType?: string;
  subscriptionType?: string;
  subscriptionStatus?: string;
  subscriptionStartDate?: string;
  subscriptionEndDate?: string;
  isEarlyUser?: boolean;
  paypalSubscriptionId?: string;
  loyaltyPoints?: number;
  referralCode?: string;
  referredBy?: string;
  twitterFollowed?: boolean;
  totalReferrals?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock authentication check
    const checkAuth = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock user data
        const mockUser: User = {
          id: "1",
          email: "user@example.com",
          firstName: "John",
          lastName: "Doe",
          company: "TechCorp",
          loyaltyPoints: 150,
          referralCode: "REF123",
          isEarlyUser: true,
          subscriptionType: "pro"
        };
        
        setUser(mockUser);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logout = () => {
    setUser(null);
  };

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    logout
  };
}
