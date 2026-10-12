const { ZodError } = require('../validations/zodHelper');

const validate = (schema) => (req, res, next) => {
  try {
    if (req.body && typeof req.body === 'object') {
      if (req.body.email && typeof req.body.email === 'string') {
        req.body.email = req.body.email.trim().toLowerCase();
      }
      if (req.body.name && typeof req.body.name === 'string') {
        req.body.name = req.body.name.trim();
      }
    }
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const firstMsg = err.errors?.[0]?.message || 'Validation failed';
      return res.status(400).json({
        error: firstMsg,
        details: (err.errors || []).map(e => ({ path: e.path.join('.'), message: e.message }))
      });
    }
    next(err);
  }
};

module.exports = { validate };
