import React, { useEffect, useRef, useCallback } from 'react';
import { pb, ensureConnection, connectionStatus } from '@/services/pocketbase/client';
import type { RealtimeEvent, GameStateEvent, AnswerEvent, TeamEvent } from '@/types';

export interface UseRealtimeSyncOptions {
  gameId?: string;
  autoReconnect?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Error) => void;
}

export function useRealtimeSync<T = any>(
  subscriptionPath: string,
  callback: (event: RealtimeEvent<T>) => void,
  options: UseRealtimeSyncOptions = {}
) {
  const {
    gameId,
    autoReconnect = true,
    onConnect,
    onDisconnect,
    onError
  } = options;

  const subscriptionRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const subscribe = useCallback(() => {
    try {
      // Clear any existing subscription
      if (subscriptionRef.current) {
        pb.collection(subscriptionPath.split('/')[0]).unsubscribe(subscriptionRef.current);
      }

      // Create new subscription
      const subscriptionId = pb.collection(subscriptionPath).subscribe(
        gameId || '*',
        (event: RealtimeEvent<T>) => {
          console.log(`Real-time event received from ${subscriptionPath}:`, event);
          callback(event);
        },
        {
          // Additional subscription options
          $autoCancel: false,
        }
      );

      subscriptionRef.current = subscriptionId;

      if (onConnect) {
        onConnect();
      }

      console.log(`Subscribed to real-time updates: ${subscriptionPath}`);
    } catch (error) {
      console.error(`Failed to subscribe to ${subscriptionPath}:`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  }, [subscriptionPath, gameId, callback, onConnect, onError]);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      try {
        const collectionName = subscriptionPath.split('/')[0];
        pb.collection(collectionName).unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
        console.log(`Unsubscribed from real-time updates: ${subscriptionPath}`);
      } catch (error) {
        console.error(`Failed to unsubscribe from ${subscriptionPath}:`, error);
      }
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, [subscriptionPath]);

  const handleReconnect = useCallback(() => {
    if (!autoReconnect) return;

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    const delay = Math.min(1000 * Math.pow(2, connectionStatus.reconnectAttempts), 30000);

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Attempting to reconnect to ${subscriptionPath}...`);
      subscribe();
    }, delay);
  }, [autoReconnect, subscriptionPath, subscribe]);

  // Subscribe on mount and handle connection changes
  useEffect(() => {
    subscribe();

    // Handle connection status changes
    const handleConnectionChange = () => {
      if (!connectionStatus.isConnected) {
        if (onDisconnect) {
          onDisconnect();
        }
        handleReconnect();
      } else {
        subscribe();
      }
    };

    // Listen for connection events
    pb.realtime.onConnect(handleConnectionChange);
    pb.realtime.onDisconnect(handleConnectionChange);

    return () => {
      unsubscribe();
      pb.realtime.onConnect(() => {});
      pb.realtime.onDisconnect(() => {});
    };
  }, [subscribe, unsubscribe, handleReconnect, onDisconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return {
    subscribe,
    unsubscribe,
    isConnected: connectionStatus.isConnected,
    reconnectAttempts: connectionStatus.reconnectAttempts
  };
}

// Specific hooks for different entity types
export function useGameStateSync(
  gameId: string,
  callback: (event: GameStateEvent) => void,
  options?: Omit<UseRealtimeSyncOptions, 'gameId'>
) {
  return useRealtimeSync('game_state', callback, { ...options, gameId });
}

export function useAnswerSync(
  gameId: string,
  callback: (event: AnswerEvent) => void,
  options?: Omit<UseRealtimeSyncOptions, 'gameId'>
) {
  return useRealtimeSync('answers', callback, {
    ...options,
    gameId
  });
}

export function useTeamSync(
  gameId: string,
  callback: (event: TeamEvent) => void,
  options?: Omit<UseRealtimeSyncOptions, 'gameId'>
) {
  return useRealtimeSync('teams', callback, { ...options, gameId });
}

// Hook for connection status monitoring
export function useConnectionStatus() {
  const [isConnected, setIsConnected] = React.useState(connectionStatus.isConnected);
  const [lastConnected, setLastConnected] = React.useState(connectionStatus.lastConnected);

  useEffect(() => {
    const updateStatus = () => {
      setIsConnected(connectionStatus.isConnected);
      setLastConnected(connectionStatus.lastConnected);
    };

    pb.realtime.onConnect(updateStatus);
    pb.realtime.onDisconnect(updateStatus);

    return () => {
      pb.realtime.onConnect(() => {});
      pb.realtime.onDisconnect(() => {});
    };
  }, []);

  return {
    isConnected,
    lastConnected,
    reconnectAttempts: connectionStatus.reconnectAttempts,
    ensureConnection
  };
}

// Hook for page visibility (mobile app switching detection)
export function usePageVisibility() {
  const [isVisible, setIsVisible] = React.useState(!document.hidden);

  useEffect(() => {
    const handleVisibilityChange = () => {
      const newVisibility = !document.hidden;
      setIsVisible(newVisibility);

      // When page becomes visible again, ensure connection
      if (newVisibility && !connectionStatus.isConnected) {
        ensureConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return isVisible;
}

// Hook for online/offline status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (!connectionStatus.isConnected) {
        ensureConnection();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}