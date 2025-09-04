// Middleware to disable Kanban routes when feature flag is off
module.exports = function kanbanFlagMiddleware(req, res, next) {
  if (process.env.KANBAN_ENABLED === 'false') {
    return res.status(404).json({ message: 'Kanban module disabled' });
  }
  next();
};