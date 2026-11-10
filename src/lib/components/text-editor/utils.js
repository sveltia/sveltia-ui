/**
 * Helpers shared by the editor modules.
 */

/**
 * Combine the given cleanup handlers into one, which calls them in the given order. Missing
 * handlers, like those of the features that are not enabled, are skipped.
 * @param {...((() => void) | undefined | null)} unregisters Cleanup handlers.
 * @returns {() => void} Combined cleanup handler.
 */
export const mergeUnregisters = (...unregisters) => {
  const handlers = unregisters.filter((unregister) => typeof unregister === 'function');

  return () => {
    handlers.forEach((unregister) => unregister());
  };
};
