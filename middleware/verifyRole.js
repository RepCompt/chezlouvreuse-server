const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userRole = decodedToken.userRole;
    if (userRole && userRole !== "admin") {
      return res.status(400).json({error: 'Vous n\'avez pas l\'autorisation d\'accès !'});
    } else {
      next();
    }
  } catch {
    return res.status(401).json({error: 'Ooops! vous devez vous reconnecter'});
  }
};