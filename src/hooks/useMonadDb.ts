import { useState, useEffect, useCallback } from 'react';
import { monadDb } from '../services/MonadDbService';
import { monadDbIntegration } from '../services/MonadDbIntegration';

/**
 * Hook for using MonadDb in React components
 * 
 * @param namespace The namespace to use for storage
 * @returns Methods and state for interacting with MonadDb
 */
export function useMonadDb<T>(namespace: string = 'default') {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Record<string, T>>({});

  // Initialize MonadDb
  useEffect(() => {
    const initialize = async () => {
      try {
        if (!monadDb['isInitialized']) {
          monadDb.initialize();
        }
        
        await monadDbIntegration.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    initialize();
  }, []);

  // Get a value from MonadDb
  const getValue = useCallback(async (key: string): Promise<T | null> => {
    if (!isInitialized) {
      throw new Error('MonadDb not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const value = await monadDb.get<T>(key, namespace);
      
      if (value) {
        setData(prev => ({ ...prev, [key]: value }));
      }
      
      return value;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, namespace]);

  // Store a value in MonadDb
  const storeValue = useCallback(async (key: string, value: T): Promise<string> => {
    if (!isInitialized) {
      throw new Error('MonadDb not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const merkleRoot = await monadDb.put(key, value, namespace);
      
      // Update local data
      setData(prev => ({ ...prev, [key]: value }));
      
      return merkleRoot;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, namespace]);

  // Delete a value from MonadDb
  const deleteValue = useCallback(async (key: string): Promise<boolean> => {
    if (!isInitialized) {
      throw new Error('MonadDb not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await monadDb.delete(key, namespace);
      
      // Update local data
      if (result) {
        setData(prev => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
      }
      
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, namespace]);

  // Get all values in the namespace
  const getAllValues = useCallback(async (): Promise<Record<string, T>> => {
    if (!isInitialized) {
      throw new Error('MonadDb not initialized');
    }

    setIsLoading(true);
    setError(null);

    try {
      // This is a simplified implementation
      // In a real implementation, we would need to query all keys in the namespace
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return {};
    } finally {
      setIsLoading(false);
    }
  }, [isInitialized, data]);

  // Get MonadDb stats
  const getStats = useCallback(() => {
    if (!isInitialized) {
      return null;
    }

    return monadDb.getStats();
  }, [isInitialized]);

  return {
    isInitialized,
    isLoading,
    error,
    data,
    getValue,
    storeValue,
    deleteValue,
    getAllValues,
    getStats
  };
}
