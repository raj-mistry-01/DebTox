import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/services/api';
import { Group, Expense, Friend, Activity } from '@/types';

// Groups Hook
export function useGroups(refreshTrigger?: number) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.listGroups();
      setGroups(response.groups || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups, refreshTrigger]);

  return { groups, loading, error, refetch: fetchGroups };
}

// Single Group Details Hook
export function useGroup(groupId: string) {
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const fetchGroup = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getGroup(groupId);
        setGroup(response);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch group');
        setGroup(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId]);

  return { group, loading, error };
}

// Expenses Hook
export function useExpenses(groupId: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!groupId) {
      setLoading(false);
      return;
    }

    const fetchExpenses = async () => {
      try {
        setLoading(true);
        const response = await apiClient.getGroupExpenses(groupId);
        setExpenses(response.expenses || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch expenses');
        setExpenses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExpenses();
  }, [groupId]);

  return { expenses, loading, error };
}

// Friends Hook
export function useFriends(refreshTrigger?: number) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFriends = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getFriendsList();
      setFriends(response.friends || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch friends');
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends, refreshTrigger]);

  return { friends, loading, error, refetch: fetchFriends };
}

// Activity Hook
export function useActivity(refreshTrigger?: number) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.getActivity();
      setActivities(response.activities || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activity');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity, refreshTrigger]);

  return { activities, loading, error, refetch: fetchActivity };
}
