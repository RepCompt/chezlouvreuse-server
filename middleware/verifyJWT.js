const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;
    if (req.body.userId && req.body.userId !== userId) {
      return res.status(402).json({error: 'Invalid user ID'});
    } else {
      next();
    }
  } catch {
    return res.status(401).json({error: 'Ooops! vous devez vous reconnecter'});
  }
};