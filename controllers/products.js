const db = require("../config/dbConf");
const fs = require("fs");
const cloudinary = require("../config/cloudinaryConf");
const utils = require("../utils");

exports.getTypesProducts = (req, res) => {
  const sqlReq = "SELECT DISTINCT nom from types_produits ORDER BY nom";
  db.query(sqlReq, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Une erreur est survenue, veuillez rafraichir la page",
      });
    } else {
      if (result.length > 0) {
        return res.status(200).json({
          resultat: result,
        });
      } else {
        return res
          .status(501)
          .json({ error: "La liste des marques est indisponible !" });
      }
    }
  });
};

exports.getSearchTypes = (req, res) => {
  const value = req.body.value;
  const sqlReq =
    "SELECT DISTINCT nom from types_produits WHERE nom LIKE ? ORDER BY nom";
  if (value) {
    db.query(sqlReq, [value], (err, result) => {
      if (err) {
        console.log(err);
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          return res.status(200).json({
            resultat: result,
          });
        } else {
          return res.status(501).json({ error: "Introuvable !" });
        }
      }
    });
  }
};

exports.getAllProducts = (req, res) => {
  let page =
    !utils.empty(req.query.page) && req.query.page !== "undefined"
      ? req.query.page
      : 1;
  let numPerPage = 20;
  let skip = (page - 1) * numPerPage;
  let limit = skip + "," + numPerPage;
  const sqlReqCount =
    "SELECT count(*) as numRows FROM produits WHERE quantite > 0";
  const sqlReq = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
  let productsList = [];
  db.query(sqlReqCount, (errr, rows) => {
    if (errr) {
      return res.status(500).json({
        error: "Une erreur est survenue, veuillez rafraichir la page",
      });
    } else {
      db.query(sqlReq, (err, result) => {
        if (err) {
          return res.status(500).json({
            error: "Une erreur est survenue, veuillez rafraichir la page",
          });
        } else {
          if (result.length > 0) {
            result.map((product) =>
              productsList.push({
                id: product.id,
                image: product.image,
                prix: product.prix,
                type: product.type,
                marque: product.marque,
                modele: product.modele,
                quantite: product.quantite,
                nomVendeur: product.nomVendeur,
                prenomVendeur: product.prenomVendeur,
                mailVendeur: product.mailVendeur,
              })
            );
            return res.status(200).json({
              resultat: productsList,
            });
          } else {
            return res
              .status(501)
              .json({ error: "La liste de produits est vide !" });
          }
        }
      });
    }
  });
};

exports.newProduct = (req, res) => {
  const image = req.files.image;
  const prix = req.body.prix;
  const poid = req.body.poid;
  const type = req.body.type ? req.body.type : "";
  const marque = req.body.marque ? req.body.marque : "";
  const modele = req.body.modele ? req.body.modele : "";
  const idVendeur = req.body.idUser;
  const quantite = req.body.quantite;

  const sqlReq =
    "INSERT INTO produits (image, cloudImgID, prix, poid, type, marque, modele, id_vendeur, quantite) VALUES (?,?,?,?,?,?,?,?,?)";

  cloudinary.uploader.upload(image.tempFilePath, (errImg, resImg) => {
    if (prix && type && idVendeur && quantite) {
      db.query(
        sqlReq,
        [
          resImg.url,
          resImg.public_id,
          prix,
          poid,
          type,
          marque,
          modele,
          idVendeur,
          quantite,
        ],
        (err, result) => {
          if (err) {
            return res.status(500).json({
              error: "Une erreur est survenue, veuillez rafraichir la page",
            });
          } else {
            if (result.length > 0) {
              return res.status(501).json({ error: "Introuvable !" });
            } else {
              fs.unlink(image.tempFilePath, (unRes, unErr) => {});
              return res
                .status(200)
                .json({ success: "Produit ajouté avec succès" });
            }
          }
        }
      );
    }
  });
};

exports.getProductsPref = (req, res) => {
  const prefMarques = req.body.prefMarques
    ? req.body.prefMarques.join("|")
    : " ";
  const prefModeles = req.body.prefModeles
    ? req.body.prefModeles.join("|")
    : " ";
  const prefTypes = req.body.prefTypes ? req.body.prefTypes.join("|") : " ";
  const specPref = req.body.specPref ? req.body.specPref : false;
  const specSearch = req.body.specSearch ? req.body.specSearch : false;
  let productsList = [];
  let page =
    !utils.empty(req.query.page) && req.query.page !== "undefined"
      ? req.query.page
      : 1;
  let numPerPage = 20;
  let skip = (page - 1) * numPerPage;
  let limit = skip + "," + numPerPage;

  const sqlReqPref = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE quantite > 0 ORDER BY marque REGEXP ('^(${prefMarques})$') OR modele REGEXP ('^(${prefModeles})$') OR type REGEXP ('^(${prefTypes})$') DESC LIMIT ${limit}`;
  const sqlReqPrefCount = `SELECT count(*) as numRows FROM produits WHERE quantite > 0 LIMIT ${limit}`;
  const sqlReqSearch = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE (marque REGEXP ('^(${prefMarques})$') OR modele REGEXP ('^(${prefModeles})$') OR type REGEXP ('^(${prefTypes})$')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
  const sqlReqSearchCount = `SELECT count(*) as numRows FROM produits WHERE (marque REGEXP ('${prefMarques}') OR modele REGEXP ('${prefModeles}') OR type REGEXP ('${prefTypes}')) AND quantite > 0 LIMIT ${limit}`;
  let sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE (marque REGEXP ('${prefMarques}') OR modele REGEXP ('${prefModeles}') OR type REGEXP ('${prefTypes}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
  let sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE (marque REGEXP ('^(${prefMarques})$') OR modele REGEXP ('^(${prefModeles})$') OR type REGEXP ('^(${prefTypes})$') AND quantite > 0 LIMIT ${limit}`;
  if (!utils.empty(prefMarques) && !utils.empty(prefTypes)) {
    if (!utils.empty(prefModeles)) {
      sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE (marque REGEXP ('${prefMarques}') AND modele REGEXP ('${prefModeles}') AND type REGEXP ('${prefTypes}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
      sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE (marque REGEXP ('${prefMarques}') AND modele REGEXP ('${prefModeles}') AND type REGEXP ('${prefTypes}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    } else {
      sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE (marque REGEXP ('${prefMarques}') AND type REGEXP ('${prefTypes}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
      sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE (marque REGEXP ('${prefMarques}') AND type REGEXP ('${prefTypes}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    }
  } else if (!utils.empty(prefMarques) && !utils.empty(prefModeles)) {
    if (!utils.empty(prefTypes)) {
      sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE (marque REGEXP ('^(${prefMarques})$') AND modele REGEXP ('^(${prefModeles})$')) AND type REGEXP ('^(${prefTypes})$') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
      sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE (marque REGEXP ('${prefMarques}') AND modele REGEXP ('${prefModeles}')) AND type REGEXP ('${prefTypes}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    } else {
      sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE (marque REGEXP ('${prefMarques}') AND modele REGEXP ('${prefModeles}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
      sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE (marque REGEXP ('${prefMarques}') AND modele REGEXP ('${prefModeles}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    }
  } else if (!utils.empty(prefMarques) && utils.empty(prefTypes)) {
    if (!utils.empty(prefModeles)) {
      sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE marque REGEXP ('${prefMarques}') AND modele REGEXP ('${prefModeles}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
      sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE marque REGEXP ('${prefMarques}') AND modele REGEXP ('${prefModeles}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    } else {
      sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE marque REGEXP ('${prefMarques}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
      sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE marque REGEXP ('${prefMarques}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    }
  } else if (utils.empty(prefMarques) && !utils.empty(prefTypes)) {
    sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE type REGEXP ('${prefTypes}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE type REGEXP ('${prefTypes}') AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
  } else {
    sqlReqSpec = `SELECT users.id AS idVendeur, users.nom AS nomVendeur, users.prenom AS prenomVendeur, users.mail AS mailVendeur, produits.* FROM produits INNER JOIN users ON produits.id_vendeur = users.id WHERE (marque REGEXP ('${prefMarques}') OR modele REGEXP ('${prefModeles}') OR type REGEXP ('${prefTypes}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
    sqlReqSpecCount = `SELECT count(*) as numRows FROM produits WHERE (marque REGEXP ('${prefMarques}') OR modele REGEXP ('${prefModeles}') OR type REGEXP ('${prefTypes}')) AND quantite > 0 ORDER BY creation_date LIMIT ${limit}`;
  }
  const sqlReqTer = specPref ? sqlReqSpec : sqlReqPref;
  const sqlReq = specSearch ? sqlReqSearch : sqlReqTer;

  const sqlReqTerCount = specPref ? sqlReqSpecCount : sqlReqPrefCount;
  const sqlReqCount = specSearch ? sqlReqSearchCount : sqlReqTerCount;

  if (prefMarques || prefModeles || prefTypes) {
    db.query(sqlReqCount, (errr, rows) => {
      if (errr) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        db.query(sqlReq, (err, result) => {
          if (err) {
            return res.status(500).json({
              error: "Une erreur est survenue, veuillez rafraichir la page",
            });
          } else {
            if (result.length > 0) {
              result.map((product) =>
                productsList.push({
                  id: product.id,
                  image: product.image,
                  prix: product.prix,
                  type: product.type,
                  marque: product.marque,
                  modele: product.modele,
                  quantite: product.quantite,
                  nomVendeur: product.nomVendeur,
                  prenomVendeur: product.prenomVendeur,
                  mailVendeur: product.mailVendeur,
                })
              );
              return res.status(200).json({
                resultat: productsList,
              });
            } else {
              return res
                .status(501)
                .json({ error: "La liste de produits est vide !" });
            }
          }
        });
      }
    });
  } else {
    return res.status(501).json({ error: "La liste de produits est vide !" });
  }
};

exports.getMarquesDispo = (req, res) => {
  const sqlReq = `SELECT DISTINCT marque from produits WHERE quantite > 0 AND marque IS NOT NULL AND marque != "" ORDER BY marque`;
  db.query(sqlReq, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Une erreur est survenue, veuillez rafraichir la page",
      });
    } else {
      if (result.length > 0) {
        let resultMarques = [];

        for (let i = 0; i < result.length; i++) {
          for (let j = 0; j < result[i].marque.split(",").length; j++) {
            let verifIncludes = resultMarques.some(
              (element) => element.marque === result[i].marque.split(",")[j]
            );
            if (!verifIncludes) {
              resultMarques.push({ marque: result[i].marque.split(",")[j] });
            }
          }
        }
        return res.status(200).json({
          resultat: resultMarques,
        });
      } else {
        return res
          .status(501)
          .json({ error: "La liste des marques est indisponible !" });
      }
    }
  });
};

exports.getModelesDispo = (req, res) => {
  const marques = req.body.marques ? req.body.marques.join("|") : " ";
  // const sqlReq =
  //   `SELECT DISTINCT produits.modele FROM produits INNER JOIN voitures WHERE produits.marque REGEXP ('${marques}') AND voitures.marque REGEXP ('${marques}') AND produits.modele = voitures.modele AND quantite > 0 AND produits.modele != ""`;
  const sqlReq = `SELECT DISTINCT produits.modele FROM produits INNER JOIN voitures WHERE produits.marque REGEXP ('${marques}') AND voitures.marque REGEXP ('${marques}') AND quantite > 0 AND produits.modele != ""`;

  if (!utils.empty(marques)) {
    db.query(sqlReq, (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          let resultModeles = [];

        for (let i = 0; i < result.length; i++) {
          for (let j = 0; j < result[i].modele.split(",").length; j++) {
            let verifIncludes = resultModeles.some(
              (element) => element.modele === result[i].modele.split(",")[j]
            );
            if (!verifIncludes) {
              resultModeles.push({ modele: result[i].modele.split(",")[j] });
            }
          }
        }
        return res.status(200).json({
          resultat: resultModeles,
        });

          return res.status(200).json({
            resultat: result,
          });
        } else {
          return res
            .status(501)
            .json({ error: "La liste des marques est indisponible !" });
        }
      }
    });
  }
};

exports.getTypesDispo = (req, res) => {
  const sqlReq =
    "SELECT DISTINCT type from produits WHERE quantite > 0 ORDER BY type";
  db.query(sqlReq, (err, result) => {
    if (err) {
      return res.status(500).json({
        error: "Une erreur est survenue, veuillez rafraichir la page",
      });
    } else {
      if (result.length > 0) {
        return res.status(200).json({
          resultat: result,
        });
      } else {
        return res
          .status(501)
          .json({ error: "La liste des marques est indisponible !" });
      }
    }
  });
};

exports.getProductInfo = (req, res) => {
  const idProduct = req.body.idProduct;
  const sqlReq = "SELECT * from produits WHERE id =  ?";
  const sqlReqVendeur = "SELECT * from users WHERE id =  ?";
  if (!utils.empty(idProduct)) {
    db.query(sqlReq, [idProduct], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          let vendeur = "";
          let resultTable = result[0];
          db.query(sqlReqVendeur, [result[0].id_vendeur], (err, resultt) => {
            if (err) {
              return res.status(500).json({
                error: "Une erreur est survenue, veuillez rafraichir la page",
              });
            } else {
              if (resultt.length > 0) {
                vendeur = `${resultt[0].prenom} ${resultt[0].nom}`;
                resultTable.vendeur = vendeur;
                return res.status(200).json({
                  resultat: resultTable,
                });
              }
            }
          });
        } else {
          return res.status(501).json({ error: "Article non disponible !" });
        }
      }
    });
  }
};

exports.editProduct = (req, res) => {
  const idProduct = req.body.idProduct;
  const image = req.files ? req.files.image : "";
  const prix = req.body.prix;
  const poid = req.body.poid;
  const type = req.body.type ? req.body.type : "";
  const marque = req.body.marque ? req.body.marque : "";
  const modele = req.body.modele ? req.body.modele : "";
  const idVendeur = req.body.idUser;
  const quantite = req.body.quantite;

  if (utils.empty(image)) {
    const sqlReq = `UPDATE produits SET prix = ('${prix}'), poid = ('${poid}'), type = ('${type}'), marque = ('${marque}'), modele = ('${modele}'), quantite = ('${quantite}') WHERE id = ${idProduct}`;

    if (prix && poid && type && idVendeur && idProduct && quantite) {
      db.query(sqlReq, [], (err, result) => {
        if (err) {
          return res.status(500).json({
            error: "Une erreur est survenue, veuillez rafraichir la page",
          });
        } else {
          if (result.length > 0) {
            return res.status(501).json({ error: "Produit introuvable !" });
          } else {
            return res
              .status(200)
              .json({ success: "Produit modifié avec succès" });
          }
        }
      });
    }
  } else {
    const sqlReq = `UPDATE produits SET image = (?), cloudImgID = (?), prix = ('${prix}'), poid = ('${poid}') type = ('${type}'), marque = ('${marque}'), modele = ('${modele}'), quantite = ('${quantite}') WHERE id = ${idProduct}`;

    cloudinary.uploader.upload(image.tempFilePath, (errImg, resImg) => {
      if (prix && poid && type && idVendeur && idProduct && quantite) {
        db.query(sqlReq, [resImg.url, resImg.public_id], (err, result) => {
          if (err) {
            return res.status(500).json({
              error: "Une erreur est survenue, veuillez rafraichir la page",
            });
          } else {
            if (result.length > 0) {
              return res.status(501).json({ error: "Produit introuvable !" });
            } else {
              fs.unlink(image.tempFilePath, (unRes, unErr) => {});
              return res
                .status(200)
                .json({ success: "Produit ajouté avec succès" });
            }
          }
        });
      }
    });
  }
};

exports.getListProductsVendeur = (req, res) => {
  const idVendeur = req.session.user.id;
  let page =
    !utils.empty(req.query.page) && req.query.page !== "undefined"
      ? req.query.page
      : 1;
  let numPerPage = 10;
  let skip = (page - 1) * numPerPage;
  let limit = skip + "," + numPerPage;
  const sqlReqCount =
    "SELECT count(*) as numRows FROM produits WHERE id_vendeur =  ?";
  const sqlReq = `SELECT * from produits WHERE id_vendeur =  ? ORDER BY creation_date LIMIT ${limit}`;
  if (!utils.empty(idVendeur)) {
    db.query(sqlReqCount, [idVendeur], (errr, rows) => {
      if (errr) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        db.query(sqlReq, [idVendeur], (err, result) => {
          if (err) {
            return res.status(500).json({
              error: "Une erreur est survenue, veuillez rafraichir la page",
            });
          } else {
            if (result.length > 0) {
              return res.status(200).json({
                resultat: result,
              });
            } else {
              return res.status(501).json({ error: "Aucun produit trouvé !" });
            }
          }
        });
      }
    });
  }
};

exports.deleteProduct = (req, res) => {
  const idProduct = req.body.idProduct;

  const sqlReq = `SELECT * from produits WHERE id =  ?`;
  const sqlReqDel = `DELETE FROM produits WHERE id = ${idProduct}; DELETE FROM panier WHERE id_produit = ${idProduct}`;

  if (!utils.empty(idProduct)) {
    db.query(sqlReq, [idProduct], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          db.query(sqlReqDel, (err, deletedRes) => {
            if (err) {
              return res.status(500).json({
                error: "Une erreur est survenue, veuillez rafraichir la page",
              });
            } else {
              cloudinary.uploader.destroy(result[0].cloudImgID);
              return res.status(200).json({
                success: "Produit supprimé avec succès",
              });
            }
          });
        } else {
          return res.status(501).json({ error: "Aucun produit trouvé !" });
        }
      }
    });
  }
};
