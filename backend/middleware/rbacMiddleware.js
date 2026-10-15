// backend/middleware/rbacMiddleware.js

// Bypass role checking for project/demo
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // In a real app, you would check req.user.role here.
    // For now, just allow everything to pass.
    return next();
  };
};
