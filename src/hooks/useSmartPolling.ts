'use client'

import { useState, useEffect, useRef } from 'react';

interface UseSmartPollingOptions<T> {
    onSuccess?: (data: T) => void;
    onFailure?: (error: Error) => void;
    maxAttempts?: number;
    initialDelay?: number;
}

export function useSmartPolling<T>(
    url: string | null,
    shouldPoll: boolean,
    options: UseSmartPollingOptions<T> = {}
) {
    const { maxAttempts = 60, initialDelay = 1000 } = options;
    const [data, setData] = useState<T | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const attemptsRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Keep the latest options in a ref to avoid resetting the effect when callbacks change
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        if (!url || !shouldPoll) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            abortControllerRef.current?.abort();
            return;
        }

        let cancelled = false;

        const poll = async () => {
            // Abort any previous in-flight request
            abortControllerRef.current?.abort();
            const controller = new AbortController();
            abortControllerRef.current = controller;

            try {
                const res = await fetch(url, { cache: 'no-store', signal: controller.signal });
                if (cancelled) return;
                if (!res.ok) throw new Error(`Polling error: ${res.status}`);

                const result = await res.json() as T;
                if (cancelled) return;
                setData(result);

                // Check if job completed successfully
                if ((result as Record<string, unknown>).status === 'completed') {
                    optionsRef.current.onSuccess?.(result);
                    return; // Stop polling
                }

                // Check if job failed
                if ((result as Record<string, unknown>).status === 'failed') {
                    const failErr = new Error(((result as Record<string, unknown>).error as string) || 'Job failed');
                    setError(failErr);
                    optionsRef.current.onFailure?.(failErr);
                    return; // Stop polling
                }

                // Continue polling if not max attempts
                if (attemptsRef.current < maxAttempts) {
                    attemptsRef.current++;
                    // Exponential backoff: 1s, 1.1s, 1.2s... cap at 5s
                    const nextDelay = Math.min(initialDelay * Math.pow(1.1, attemptsRef.current), 5000);
                    timeoutRef.current = setTimeout(poll, nextDelay);
                } else {
                    const timeoutErr = new Error('Polling timed out');
                    setError(timeoutErr);
                    optionsRef.current.onFailure?.(timeoutErr);
                }
            } catch (err) {
                if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
                console.error(err);
                // Retry on network error, but check max attempts
                attemptsRef.current++;
                if (attemptsRef.current >= maxAttempts) {
                    const timeoutErr = new Error('Polling timed out after network errors');
                    setError(timeoutErr);
                    optionsRef.current.onFailure?.(timeoutErr);
                    return;
                }
                timeoutRef.current = setTimeout(poll, 5000);
            }
        };

        // Reset and start
        attemptsRef.current = 0;
        poll();

        return () => {
            cancelled = true;
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            abortControllerRef.current?.abort();
        };
    }, [url, shouldPoll, maxAttempts, initialDelay]);

    return { data, error };
}
