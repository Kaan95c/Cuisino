import React, { createContext, useContext, useState, useCallback } from 'react';
import { apiService } from '../services/api';

interface UnreadContextType {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  setUnreadCount: (count: number) => void;
}

const UnreadContext = createContext<UnreadContextType | undefined>(undefined);

export const UnreadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await apiService.getUnreadConversationsCount();
      setUnreadCount(response.unread_conversations_count);
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  }, []);

  return (
    <UnreadContext.Provider value={{ unreadCount, refreshUnreadCount, setUnreadCount }}>
      {children}
    </UnreadContext.Provider>
  );
};

export const useUnread = () => {
  const context = useContext(UnreadContext);
  if (context === undefined) {
    throw new Error('useUnread must be used within an UnreadProvider');
  }
  return context;
};
