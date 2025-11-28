// Authentication middleware for protected dashboard routes

const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  res.redirect('/dashboard/login');
};

const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  }

  next();
};

module.exports = {
  requireAuth,
  redirectIfAuthenticated
};
