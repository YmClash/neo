import { useState, useEffect } from 'react';

export interface FocusState {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  durationMinutes: number;
}

const DEFAULT_STATE: FocusState = {
  isActive: false,
  startTime: null,
  endTime: null,
  durationMinutes: 25,
};

export function useFocusTimer() {
  const [focusState, setFocusState] = useState<FocusState>(DEFAULT_STATE);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Load initial state
  useEffect(() => {
    chrome.storage.local.get('neo_focus_state', (result) => {
      if (result.neo_focus_state) {
        setFocusState(result.neo_focus_state);
        updateTimeLeft(result.neo_focus_state);
      }
    });

    // Listen for state changes from background worker
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes.neo_focus_state) {
        setFocusState(changes.neo_focus_state.newValue);
        updateTimeLeft(changes.neo_focus_state.newValue);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  // Timer tick
  useEffect(() => {
    if (!focusState.isActive || !focusState.endTime) return;

    const interval = setInterval(() => {
      updateTimeLeft(focusState);
    }, 1000);

    return () => clearInterval(interval);
  }, [focusState.isActive, focusState.endTime]);

  const updateTimeLeft = (state: FocusState) => {
    if (!state.isActive || !state.endTime) {
      setTimeLeft(state.durationMinutes * 60);
      return;
    }
    const remaining = Math.max(0, Math.floor((state.endTime - Date.now()) / 1000));
    setTimeLeft(remaining);

    // If timer reached 0, auto-stop (alarm in background will handle notification)
    if (remaining === 0 && state.isActive) {
      stopTimer();
    }
  };

  const startTimer = async (minutes: number = 25) => {
    const now = Date.now();
    const newState: FocusState = {
      isActive: true,
      startTime: now,
      endTime: now + minutes * 60 * 1000,
      durationMinutes: minutes,
    };
    await chrome.storage.local.set({ neo_focus_state: newState });
    
    // Notify background worker to set alarm
    chrome.runtime.sendMessage({
      type: 'FOCUS_START',
      payload: { minutes }
    });
  };

  const stopTimer = async () => {
    const newState: FocusState = {
      ...focusState,
      isActive: false,
      startTime: null,
      endTime: null,
    };
    await chrome.storage.local.set({ neo_focus_state: newState });
    
    // Notify background worker to clear alarm
    chrome.runtime.sendMessage({
      type: 'FOCUS_STOP'
    });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return {
    focusState,
    timeLeft,
    formattedTime: formatTime(timeLeft),
    startTimer,
    stopTimer,
  };
}
