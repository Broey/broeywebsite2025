export function rateLimitMessage(retryAfter: string | null) {
  const defaultMessage = "Too many attempts were made. Please wait before trying again.";

  if (!retryAfter) {
    return defaultMessage;
  }

  const seconds = Number(retryAfter);

  if (Number.isFinite(seconds) && seconds > 0) {
    const minutes = Math.max(1, Math.ceil(seconds / 60));
    return `Too many attempts were made. Please wait about ${minutes} ${minutes === 1 ? "minute" : "minutes"} before trying again.`;
  }

  const retryDate = Date.parse(retryAfter);

  if (!Number.isNaN(retryDate) && retryDate > Date.now()) {
    const minutes = Math.max(1, Math.ceil((retryDate - Date.now()) / 60_000));
    return `Too many attempts were made. Please wait about ${minutes} ${minutes === 1 ? "minute" : "minutes"} before trying again.`;
  }

  return defaultMessage;
}
