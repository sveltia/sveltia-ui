/**
 * @typedef {'error' | 'warning' | 'info' | 'success'} AlertStatus
 */

/**
 * Get the ARIA role for an alert status. Errors and warnings are `alert` and interrupt; information
 * and success are `status` and wait.
 * @param {AlertStatus} status Alert status.
 * @returns {'alert' | 'status'} Role.
 */
export const getAlertRole = (status) =>
  status === 'error' || status === 'warning' ? 'alert' : 'status';

/**
 * Get the ARIA live region politeness for an alert role, unless one is given explicitly.
 * @param {'alert' | 'status'} role Role from {@link getAlertRole}.
 * @param {'off' | 'polite' | 'assertive'} [ariaLive] Explicit politeness, if any.
 * @returns {'off' | 'polite' | 'assertive'} Politeness.
 */
export const getAlertAriaLive = (role, ariaLive) =>
  ariaLive ?? (role === 'alert' ? 'assertive' : 'polite');
