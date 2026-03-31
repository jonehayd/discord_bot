/**
 * Tracks active rob attempts.
 * Key: `${robberId}-${victimId}`
 * Value: { robberId, victimId, timeout, channelId }
 */
export const pendingRobs = new Map();

export const ROB_AMOUNT = 100;
export const ROB_FINE = 100;
export const ROB_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
