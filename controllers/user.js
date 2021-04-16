const db = require("../config/dbConf");
const utils = require("../utils");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

exports.createUser = (req, res) => {
  const nom = req.body.nom;
  const prenom = req.body.prenom;
  const mail = req.body.mail;
  const password = req.body.password;
  const adresse = req.body.adresse;
  const ville = req.body.ville;
  const cp = req.body.cp;
  const num = req.body.num;
  const prefMarques = req.body.prefMarques.join(",");
  const prefModeles = req.body.prefModeles.join(",");
  const sqlExist = "SELECT * from users WHERE mail = ?";
  const sqlReq =
    "INSERT INTO users (nom, prenom, mail, password, prefMarques, prefModeles) VALUES (?,?,?,?,?,?); SELECT LAST_INSERT_ID()";
  const sqlReqShiping =
    "INSERT INTO shipping_address (id_user, nom, prenom, adresse, ville, code_postal, num, isDefault) VALUES (?,?,?,?,?,?,?, 1)";

  if (
    utils.empty(nom) ||
    utils.empty(prenom) ||
    utils.empty(mail) ||
    utils.empty(password)
  ) {
    return res
      .status(400)
      .json({ error: "Veuillez remplir tout les champs nécessaires" });
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      console.log(err);
    }
    db.query(sqlExist, [mail], (err, result) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({
            error: "Une erreur est survenue, veuillez rafraichir la page",
          });
      } else {
        if (result.length > 0) {
          return res
            .status(501)
            .json({
              error:
                "Un utilisateur a déjà été inscrit avec cette adresse mail",
            });
        } else {
          db.query(
            sqlReq,
            [nom, prenom, mail, hash, prefMarques, prefModeles],
            (err, result) => {
              if (err) {
                console.log(err);
              } else {
                if (
                  !utils.empty(adresse) &&
                  !utils.empty(ville) &&
                  !utils.empty(cp)
                ) {
                  db.query(
                    sqlReqShiping,
                    [result[0].insertId, nom, prenom, adresse, ville, cp, num],
                    (err, resultShip) => {
                      if (err) {
                        console.log(err);
                      } else {
                        return res
                          .status(200)
                          .json({ success: "Utilisateur crée avec succès" });
                      }
                    }
                  );
                } else {
                  return res
                    .status(200)
                    .json({ success: "Utilisateur crée avec succès" });
                }
              }
            }
          );
        }
      }
    });
  });
};
exports.loginUser = (req, res) => {
  const mail = req.body.mail;
  const password = req.body.password;

  if (utils.empty(mail) || utils.empty(password)) {
    return res
      .status(400)
      .json({ error: "Un champ important n'est pas complété" });
  }

  const sqlReq = "SELECT * from users WHERE mail = ?;";
  db.query(sqlReq, [mail], (err, result) => {
    if (err) {
      return res
        .status(500)
        .json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
    } else {
      if (result.length > 0) {
        bcrypt.compare(password, result[0].password, (error, response) => {
          if (response) {
            const userId = result[0].id;
            const userRole = result[0].isAdmin ? "admin" : "user";
            const userInfo = {
              id: userId,
              nom: result[0].nom,
              prenom: result[0].prenom,
              mail: result[0].mail,
              marquesPref: result[0].prefMarques,
              modelesPref: result[0].prefModeles,
              isAdmin: result[0].isAdmin,
              publicKey_stripe: result[0].publicKey_stripe,
              secretKey_stripe: result[0].secretKey_stripe,
            };
            const token = jwt.sign(
              { userId, userRole },
              process.env.JWT_SECRET,
              {
                expiresIn: "365d",
              }
            );
            req.session.user = userInfo;
            return res.status(200).json({
              success: "Connexion avec succès",
              auth: true,
              user: userInfo,
              token: token,
            });
          } else {
            return res.status(401).json({ error: "Mot de passe incorrect !" });
          }
        });
      } else {
        return res.status(501).json({ error: "Utilisateur non trouvé !" });
      }
    }
  });
};

exports.isLogin = (req, res) => {
  if (req.session.user) {
    res.send({ loggedIn: true, user: req.session.user });
  } else {
    res.send({ loggedIn: false });
  }
};

exports.logoutUser = (req, res) => {
  if (req.session.user) {
    req.session.destroy();
    return res.status(200).json({
      success: "Déconnexion avec succès",
      auth: false,
      loggedIn: false,
    });
  } else {
    return res.status(501).json({ error: "Vous n'êtes pas connecté !" });
  }
};

exports.editUser = (req, res) => {
  const idUser = req.body.idUser ? req.body.idUser : "";
  const nom = req.body.nom ? req.body.nom : "";
  const prenom = req.body.prenom ? req.body.prenom : "";
  const mail = req.body.mail ? req.body.mail : "";
  const prefMarques = req.body.prefMarques ? req.body.prefMarques : "";
  const prefModeles = req.body.prefModeles ? req.body.prefModeles : "";
  const sqlReq = `UPDATE users SET nom = ('${nom}'), prenom = ('${prenom}'), mail = ('${mail}'), prefMarques = ('${prefMarques}'), prefModeles = ('${prefModeles}') WHERE id = ${idUser}`;
  const sqlGetReq = `SELECT * FROM users WHERE id = ${idUser}`;
  if (
    utils.empty(idUser) ||
    utils.empty(nom) ||
    utils.empty(prenom) ||
    utils.empty(mail)
  ) {
    return res
      .status(400)
      .json({ error: "Veuillez remplir tout les champs nécessaires" });
  }

  db.query(sqlReq, (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
    } else {
      db.query(sqlGetReq, (err, userInfoResult) => {
        if (err) {
          console.log(err);
          return res
            .status(500)
            .json({
              error: "Une erreur est survenue, veuillez rafraichir la page",
            });
        } else {
          if (userInfoResult.length > 0) {
            const userInfo = {
              id: userInfoResult[0].id,
              nom: nom,
              prenom: prenom,
              mail: mail,
              marquesPref: prefMarques,
              modelesPref: prefModeles,
              isAdmin: userInfoResult[0].isAdmin,
              publicKey_stripe: userInfoResult[0].publicKey_stripe,
              secretKey_stripe: userInfoResult[0].secretKey_stripe,
            };
            req.session.user = userInfo;
            return res.status(200).json({
              success: "Utilisateur modifié avec succès",
              user: userInfo,
            });
          } else {
            return res.status(500).json({
              error: "Utilisateur introuvable !",
              user: userInfo,
            });
          }
        }
      });
    }
  });
};

exports.getListShippingAdresses = (req, res) => {
  const idUser = req.body.idUser ? req.body.idUser : "";
  const sqlReq = `SELECT * from shipping_address WHERE id_user =  ${idUser}`;
  if (utils.empty(idUser)) {
    return res
      .status(400)
      .json({ error: "Veuillez remplir tout les champs nécessaires" });
  }

  db.query(sqlReq, (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
    } else {
      if (result.length > 0) {
        return res.status(200).json({
          adresses: result,
        });
      }
    }
  });
};

exports.updateDefaultAdresse = (req, res) => {
  const idAdresse = req.body.idAdresse ? req.body.idAdresse : "";
  const sqlReq = `UPDATE shipping_address SET isDefault = 0`;
  const sqlReqDef = `UPDATE shipping_address SET isDefault = 1 WHERE id = ${idAdresse}`;

  if(!utils.empty(idAdresse)) {
    db.query(sqlReq, (err, result) => {
      if (err) {
        console.log(err);
        return res
          .status(500)
          .json({
            error: "Une erreur est survenue, veuillez rafraichir la page",
          });
      } else {
        db.query(sqlReqDef, (err, result) => {
          if (err) {
            console.log(err);
            return res
              .status(500)
              .json({
                error: "Une erreur est survenue, veuillez rafraichir la page",
              });
          } else {
            return res.status(200).json({
              success: "L'adresse par défaut a été modifié avec succès",
            });
          }
        });
      }
    });
  }
}

exports.getAddressInfo = (req, res) => {
  const idAddress = req.body.idAddress;
  const sqlReq = "SELECT * from shipping_address WHERE id =  ?";
  if (!utils.empty(idAddress)) {
    db.query(sqlReq, [idAddress], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          return res.status(200).json({
            resultat: result[0],
          });
        } else {
          return res.status(501).json({ error: "Adresse non disponible !" });
        }
      }
    });
  }
};

exports.editAddress = (req, res) => {
  const idAddress = req.body.idAddress ? req.body.idAddress : "";
  const nom = req.body.nom ? req.body.nom : "";
  const prenom = req.body.prenom ? req.body.prenom : "";
  const adresse = req.body.adresse ? req.body.adresse : "";
  const ville = req.body.ville ? req.body.ville : "";
  const cp = req.body.cp ? req.body.cp : "";
  const num = req.body.num ? req.body.num : "";
  const sqlReq = `UPDATE shipping_address SET nom = ('${nom}'), prenom = ('${prenom}'), adresse = ('${adresse}'), ville = ('${ville}'), code_postal = ('${cp}'), num = ('${num}') WHERE id = ${idAddress}`;

  if (
    utils.empty(idAddress) ||
    utils.empty(nom) ||
    utils.empty(prenom) ||
    utils.empty(adresse) ||
    utils.empty(ville) ||
    utils.empty(cp) ||
    utils.empty(num)
  ) {
    return res
      .status(400)
      .json({ error: "Veuillez remplir tout les champs nécessaires" });
  }

  db.query(sqlReq, (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
    } else {
      return res.status(200).json({
        success: "Adresse modifié avec succès",
      });
    }
  });
};

exports.newAddress = (req, res) => {
  const idUser = req.session.user.id ? req.session.user.id : "";
  const nom = req.body.nom ? req.body.nom : "";
  const prenom = req.body.prenom ? req.body.prenom : "";
  const adresse = req.body.adresse ? req.body.adresse : "";
  const ville = req.body.ville ? req.body.ville : "";
  const cp = req.body.cp ? req.body.cp : "";
  const num = req.body.num ? req.body.num : "";
  const sqlReq = `INSERT INTO shipping_address (id_user, nom, prenom, adresse, ville, num, code_postal) VALUES (?,?,?,?,?,?,?)`;

  if (
    utils.empty(nom) ||
    utils.empty(prenom) ||
    utils.empty(adresse) ||
    utils.empty(ville) ||
    utils.empty(cp) ||
    utils.empty(num)
  ) {
    return res
      .status(400)
      .json({ error: "Veuillez remplir tout les champs nécessaires" });
  }

  db.query(sqlReq, [idUser, nom, prenom, adresse, ville, num, cp], (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
    } else {
      return res.status(200).json({
        success: "Adresse ajoutée avec succès",
      });
    }
  });
};

exports.getAddressDefault = (req, res) => {
  const idUser = req.session.user.id ? req.session.user.id : "";
  const sqlReq = "SELECT * from shipping_address WHERE id_user =  ? AND isDefault = 1";
  if (!utils.empty(idUser)) {
    db.query(sqlReq, [idUser], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          return res.status(200).json({
            resultat: result[0],
          });
        } else {
          return res.status(501).json({ error: "Adresse non disponible !" });
        }
      }
    });
  }
};

exports.deleteAddress = (req, res) => {
  const idAddress = req.body.idAddress;

  const sqlReq = `SELECT * from shipping_address WHERE id =  ?`;
  const sqlReqDel = `DELETE FROM shipping_address WHERE id = ?`;

  if (!utils.empty(idAddress)) {
    db.query(sqlReq, [idAddress], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          db.query(sqlReqDel, [idAddress], (err, deletedRes) => {
            if (err) {
              return res.status(500).json({
                error: "Une erreur est survenue, veuillez rafraichir la page",
              });
            } else {
              return res.status(200).json({
                success: "Adresse supprimée avec succès",
              });
            }
          });
        } else {
          return res.status(501).json({ error: "Adresse introuvable !" });
        }
      }
    });
  }
};

exports.addKeysStripe = (req, res) => {
  const idUser = req.session.user.id ? req.session.user.id : "";
  const publicKey = req.body.publicKey ? req.body.publicKey : "";
  const secretKey = req.body.secretKey ? req.body.secretKey : "";
  const sqlReq = `UPDATE users SET publicKey_stripe = ('${publicKey}'), secretKey_stripe = ('${secretKey}') WHERE id = ${idUser}`;

  if (
    utils.empty(idUser) ||
    utils.empty(publicKey) ||
    utils.empty(secretKey)
  ) {
    return res
      .status(400)
      .json({ error: "Veuillez remplir tout les champs nécessaires" });
  }

  db.query(sqlReq, (err, result) => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
    } else {
      return res.status(200).json({
        success: "Les clés sont enregistrées avec succès",
      });
    }
  });
};