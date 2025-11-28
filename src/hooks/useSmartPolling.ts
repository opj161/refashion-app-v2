import { useState, useEffect, useRef } from 'react';

interface UseSmartPollingOptions {
    onSuccess?: (data: any) => void;
    onFailure?: (error: any) => void;
    maxAttempts?: number;
    initialDelay?: number;
}

export function useSmartPolling(
    url: string | null,
    shouldPoll: boolean,
    options: UseSmartPollingOptions = {}
) {
    const { maxAttempts = 60, initialDelay = 1000 } = options;
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<Error | null>(null);
    const attemptsRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Keep the latest options in a ref to avoid resetting the effect when callbacks change
    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    });

    useEffect(() => {
        if (!url || !shouldPoll) {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            return;
        }

        const poll = async () => {
            try {
                const res = await fetch(url, { cache: 'no-store' });
                if (!res.ok) throw new Error(`Polling error: ${res.status}`);

                const result = await res.json();
                setData(result);

                // Check if job is done (completed or failed)
                if (result.status === 'completed' || result.status === 'failed') {
                    optionsRef.current.onSuccess?.(result);
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
                console.error(err);
                // Retry on network error, but count it
                attemptsRef.current++;
                timeoutRef.current = setTimeout(poll, 5000);
            }
        };

        // Reset and start
        attemptsRef.current = 0;
        poll();

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [url, shouldPoll, maxAttempts, initialDelay]);

    return { data, error };
}
