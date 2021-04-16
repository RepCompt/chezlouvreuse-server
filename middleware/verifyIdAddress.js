const jwt = require("jsonwebtoken");
const db = require("../config/dbConf");
const utils = require("../utils");

module.exports = (req, res, next) => {
  try {
    const token = req.headers["x-access-token"];
    const idAddress = req.body.idAddress;
    const sqlReq = "SELECT * from shipping_address WHERE id =  ?";
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decodedToken.userId;
    if (!utils.empty(idAddress)) {
      db.query(sqlReq, [idAddress], (err, result) => {
        if (err) {
          return res.status(500).json({
            error: "Une erreur est survenue, veuillez rafraichir la page",
          });
        } else {
          if (result.length > 0) {
            if (result[0].id_user === userId) {
              next();
            } else {
              return res
                .status(402)
                .json({ error: "Vous n'avez pas accès à cette adresse !" });
            }
          } else {
            return res.status(501).json({ error: "Adresse non disponible !" });
          }
        }
      });
    }
  } catch {
    return res
      .status(401)
      .json({ error: "Ooops! vous devez vous reconnecter" });
  }
};
