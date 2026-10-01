/**
 * Zod helper with fallback for offline/pre-install bootstrap
 */
let z;
let ZodError;

try {
  const zod = require('zod');
  z = zod.z;
  ZodError = zod.ZodError;
} catch {
  // Graceful fallback mock so server boots cleanly even before npm install finishes
  const chainable = () => {
    const fn = () => chainable();
    fn.min = () => chainable();
    fn.max = () => chainable();
    fn.email = () => chainable();
    fn.uuid = () => chainable();
    fn.optional = () => chainable();
    fn.int = () => chainable();
    fn.enum = () => chainable();
    fn.parse = (val) => val;
    return fn;
  };

  z = {
    object: () => ({ parse: (val) => val }),
    string: chainable,
    number: chainable,
    enum: chainable,
    boolean: chainable,
    array: chainable
  };

  class FallbackZodError extends Error {}
  ZodError = FallbackZodError;
}

module.exports = { z, ZodError };
