const db = require("../config/dbConf");
const utils = require("../utils");
const stripe = require("stripe")(process.env.STRIPE_SECRET_TEST);
const axios = require("axios");

exports.addToCart = (req, res) => {
  const idProduct = req.body.idProduct ? req.body.idProduct : "";
  const idUser = req.session.user.id ? req.session.user.id : "";
  const qte = req.body.qte ? req.body.qte : "";
  const sqlReq = `SELECT * from produits WHERE id =  ?`;
  const sqlReqCheck = `SELECT * from panier WHERE id_produit =  ? AND id_user = ?`;
  const sqlReqNew = `INSERT INTO panier (id_produit, id_user, qte, prix) VALUES (?,?,?,?)`;

  if (utils.empty(idProduct) && utils.empty(idUser) && utils.empty(qte)) {
    return res
      .status(501)
      .json({ error: "Veuillez remplir les champs obligatoires !" });
  } else {
    if (qte > 0) {
      db.query(sqlReqCheck, [idProduct, idUser], (err, result) => {
        if (err) {
          return res.status(500).json({
            error: "Une erreur est survenue, veuillez rafraichir la page",
          });
        } else {
          if (result.length > 0) {
            return res
              .status(501)
              .json({ error: "Ce produit a déjà été ajouté à votre panier !" });
          } else {
            db.query(sqlReq, [idProduct], (er, resProd) => {
              if (er) {
                return res.status(500).json({
                  error: "Une erreur est survenue, veuillez rafraichir la page",
                });
              } else {
                if (resProd.length > 0) {
                  db.query(
                    sqlReqNew,
                    [idProduct, idUser, qte, qte * resProd[0].prix],
                    (error, resNew) => {
                      if (error) {
                        return res.status(500).json({
                          error:
                            "Une erreur est survenue, veuillez rafraichir la page",
                        });
                      } else {
                        return res.status(200).json({
                          success: "Ce produit a été ajouté à votre panier",
                        });
                      }
                    }
                  );
                }
              }
            });
          }
        }
      });
    } else {
      return res.status(501).json({ error: "Quantité insuffisante !" });
    }
  }
};

exports.getArticlesInCart = (req, res) => {
  const idUser = req.session.user.id ? req.session.user.id : "";
  const sqlReqN = `SELECT * from panier WHERE id_user =  ?`;
  const sqlReq = `SELECT produits.type AS typeProduit, produits.marque AS marqueProduit, produits.modele AS modeleProduit, produits.image AS imageProduit, produits.id_vendeur AS idVendeur, produits.quantite AS quantiteMax , panier.* FROM panier INNER JOIN produits ON panier.id_produit = produits.id WHERE id_user =  ?`;

  if (utils.empty(idUser)) {
    return res.status(501).json({ error: "Veuillez vous reconnecter !" });
  } else {
    db.query(sqlReq, [idUser], (error, result) => {
      if (error) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          return res.status(200).json({
            resultat: result,
          });
        } else {
          return res.status(501).json({ error: "Le panier est vide !" });
        }
      }
    });
  }
};

exports.deleteProduct = (req, res) => {
  const idPanier = req.body.idPanier;

  const sqlReq = `SELECT * from panier WHERE id =  ?`;
  const sqlReqDel = `DELETE FROM panier WHERE id = ?`;

  if (!utils.empty(idPanier)) {
    db.query(sqlReq, [idPanier], (err, result) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (result.length > 0) {
          db.query(sqlReqDel, [idPanier], (err, deletedRes) => {
            if (err) {
              return res.status(500).json({
                error: "Une erreur est survenue, veuillez rafraichir la page",
              });
            } else {
              return res.status(200).json({
                success: "Le prroduit a été supprimé avec succès",
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

exports.modifyQtePanier = (req, res) => {
  const idPanier = req.body.idPanier;
  const idProduct = req.body.idProduct;
  const qte = req.body.qte;

  const sqlReqInfoProduct = `SELECT * from produits WHERE id =  ?`;
  const sqlReqModifyQte = `UPDATE panier SET qte = (?), prix = (?) WHERE id = ${idPanier}; SELECT * from panier WHERE id =  ${idPanier}`;

  if (!utils.empty(idPanier)) {
    db.query(sqlReqInfoProduct, [idProduct], (err, resultProduct) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (resultProduct.length > 0) {
          db.query(
            sqlReqModifyQte,
            [qte, qte * resultProduct[0].prix],
            (err, resultPanier) => {
              if (err) {
                return res.status(500).json({
                  error: "Une erreur est survenue, veuillez rafraichir la page",
                });
              } else {
                if (resultPanier.length > 0) {
                  return res.status(200).json({
                    resultat: resultPanier[1],
                  });
                }
              }
            }
          );
        } else {
          return res.status(501).json({ error: "Aucun produit trouvé !" });
        }
      }
    });
  }
};

exports.calculPrices = (req, res) => {
  const idUser = req.session.user.id ? req.session.user.id : "";

  const sqlReqSum = `SELECT SUM(prix) AS prixTotalPieces FROM panier WHERE id_user =  ${idUser}; SELECT SUM(poid*panier.qte) AS poidsTotalPieces FROM produits INNER JOIN panier WHERE produits.id = panier.id_produit AND panier.id_user = ${idUser}`;
  const sqlReqPrixTotal = `UPDATE panier SET prixTotal = ?, poidTotal = ? WHERE id_user = ${idUser}`;

  if (!utils.empty(idUser)) {
    db.query(sqlReqSum, (err, resultSum) => {
      if (err) {
        return res.status(500).json({
          error: "Une erreur est survenue, veuillez rafraichir la page",
        });
      } else {
        if (resultSum.length > 0) {
          const prixTotalPieces = resultSum[0][0].prixTotalPieces;
          const poidsTotalPieces = resultSum[1][0].poidsTotalPieces;
          let prixLivraison = 0;
          let poidsTotal = poidsTotalPieces + 30;

          if (prixTotalPieces >= 200) {
            prixLivraison = 0;
          } else {
            if (prixTotalPieces > 0) {
              if (poidsTotal <= 250) {
                prixLivraison = 4.95;
              } else if (250 < poidsTotal <= 500) {
                prixLivraison = 6.45;
              } else if (250 < poidsTotal <= 500) {
                prixLivraison = 6.45;
              } else if (500 < poidsTotal <= 750) {
                prixLivraison = 7.35;
              } else if (750 < poidsTotal <= 1000) {
                prixLivraison = 7.99;
              } else if (1000 < poidsTotal <= 2000) {
                prixLivraison = 9.15;
              } else if (2000 < poidsTotal <= 5000) {
                prixLivraison = 14.1;
              } else if (5000 < poidsTotal <= 10000) {
                prixLivraison = 20.5;
              } else if (10000 < poidsTotal <= 15000) {
                prixLivraison = 26;
              } else if (15000 < poidsTotal <= 30000) {
                prixLivraison = 32.2;
              }
            }
          }

          let prixLivraisonTotal = prixLivraison > 0 ? prixLivraison + 3 : null;
          let prixTotal =
            Math.round((prixTotalPieces + prixLivraisonTotal) * 100) / 100;

          db.query(
            sqlReqPrixTotal,
            [prixTotal, poidsTotal],
            (err, resultPanier) => {
              if (err) {
                return res.status(500).json({
                  error: "Une erreur est survenue, veuillez rafraichir la page",
                });
              } else {
                const result = {
                  prixTotalPieces: prixTotalPieces,
                  prixLivraisonTotal:
                    prixLivraisonTotal === 3 ? 0 : prixLivraisonTotal,
                  prixTotal: prixTotal > 0 ? prixTotal : null,
                };
                return res.status(200).json({
                  resultat: result,
                });
              }
            }
          );
        } else {
          return res.status(501).json({ error: "Aucun produit trouvé !" });
        }
      }
    });
  }
};

exports.charge = (req, res) => {
  const id = req.body.id;
  const idUser = req.session.user.id ? req.session.user.id : "";
  const sqlReqShippingAddress = `SELECT * FROM shipping_address WHERE id_user = ${idUser} AND isDefault = 1`;
  const sqlReqPanier = `SELECT produits.type AS typeProduit, produits.marque AS marqueProduit, produits.modele AS modeleProduit, produits.id_vendeur AS idVendeur , panier.* FROM panier INNER JOIN produits ON panier.id_produit = produits.id WHERE id_user =  ${idUser}`;
  const sqlReqNewCommand = `INSERT INTO commandes (idCommande, id_produits, noms_produits, qte_produits, id_user, id_vendeur, prix_total, label_url, id_adresse, nom_prenom, adresse, ville, code_postal, num, mail) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
  const sqlReqDel = `DELETE FROM panier WHERE id_user = ${idUser}`;
  const sqlReqDecQte = `UPDATE produits SET quantite = quantite - ? WHERE id = ? `;

  db.query(sqlReqShippingAddress, (errShipp, resultShippAddress) => {
    if (errShipp) {
      return res.status(500).json({
        error: "Une erreur est survenue, veuillez rafraichir la page",
      });
    } else {
      db.query(sqlReqPanier, (errPanier, resultPanier) => {
        if (errPanier) {
          return res.status(500).json({
            error: "Une erreur est survenue, veuillez rafraichir la page",
          });
        } else {
          let idProducts = [];
          let nameProducts = [];
          let qteProducts = [];
          for (let i = 0; i < resultPanier.length; i++) {
            idProducts.push(resultPanier[i].id_produit);
            nameProducts.push(
              `${resultPanier[i].typeProduit} ${
                resultPanier[i].marqueProduit
              } ${
                !utils.empty(resultPanier[i].modeleProduit)
                  ? `- ${resultPanier[i].modeleProduit}`
                  : ``
              }`
            );
            qteProducts.push(resultPanier[i].qte);
            db.query(
              sqlReqDecQte,
              [resultPanier[i].qte, resultPanier[i].id_produit],
              (err, resultDecQte) => {
                if (err) {
                  return res.status(500).json({
                    error:
                      "Une erreur est survenue, veuillez rafraichir la page",
                  });
                }
              }
            );
          }
          const configHeader = {
            headers: {
              "Content-Type": "application/json",
              Authorization:
                "Basic YzdlMjY2YWUyN2UyZWI3MzBmNWYxY2E3OGMwNWUwNDU6",
            },
          };
          const body = `{  "Method": "Ship",  "Params": {    "to_address": {      "name": "${
            resultShippAddress[0].nom
          } ${
            resultShippAddress[0].prenom
          }",      "company": "",      "street1": "${
            resultShippAddress[0].adresse
          }",      "street2": "",      "city": "${
            resultShippAddress[0].ville
          }",      "zip": "${
            resultShippAddress[0].code_postal
          }",      "country": "FR",      "phone": "${
            resultShippAddress[0].num
          }",      "email": "${
            req.session.user.mail
          }"    },    "from_address": {      "name": "",      "company": "REPAR COMPTEUR",      "street1": "12 RUE DU CHATEAU MOUZIN",      "street2": "",      "city": "CERNAY LES REIMS",      "zip": "51420",      "country": "FR",      "phone": "0635965895",      "email": "repar21compteur@gmail.com"    },    "parcels": [      {        "length": 5,        "width": 5,        "height": 5,        "weight": ${
            resultPanier[0].poidTotal / 1000
          }      }    ],    "TotalValue": "${
            resultPanier[0].prixTotal
          } EUR",    "TransactionID": "${
            resultPanier[0].id
          }",    "ContentDescription": "",    "Insurance": 0,    "InsuranceCurrency": "EUR",    "CashOnDelivery": 0,    "CashOnDeliveryCurrency": "EUR",    "CashOnDeliveryType": 0,    "CarrierName": "Colissimo",    "CarrierService": "Standard",    "CarrierID": 9486,    "OrderID": "${
            resultPanier[0].id
          }",    "RateID": "14922625303744",    "Incoterm": "DAP",    "BillAccountNumber": "",    "PaymentMethod": "Card",    "Note": "${
            resultPanier[0].id
          }",    "Async": false  }}`;

          try {
            const payment = stripe.paymentIntents
              .create({
                amount: (resultPanier[0].prixTotal * 100).toFixed(0),
                currency: "EUR",
                description: `Commande n° ${resultPanier[0].id}`,
                payment_method: id,
                confirm: true,
              })
              .then((result) => {
                if (result) {
                  if (result.status === "succeeded") {
                    axios
                      .post("https://www.shippypro.com/api", body, configHeader)
                      .then((resShippy) => {
                        if (resShippy.data) {
                          const labelUrl = resShippy.data.LabelURL;
                          db.query(
                            sqlReqNewCommand,
                            [
                              resultPanier[0].id,
                              idProducts.join("|"),
                              nameProducts.join("|"),
                              qteProducts.join("|"),
                              idUser,
                              1,
                              resultPanier[0].prixTotal,
                              labelUrl,
                              resultShippAddress[0].id,
                              `${resultShippAddress[0].nom} ${ resultShippAddress[0].prenom}`,
                              resultShippAddress[0].adresse,
                              resultShippAddress[0].ville,
                              resultShippAddress[0].code_postal,
                              resultShippAddress[0].num,
                              req.session.user.mail,
                            ],
                            (errCommand, resultCommand) => {
                              if (errCommand) {
                                console.log("err: ", errCommand);
                                return res.status(500).json({
                                  error:
                                    "Une erreur est survenue, veuillez rafraichir la page",
                                });
                              } else {
                                db.query(sqlReqDel, (err, resultDel) => {
                                  if (err) {
                                    return res.status(500).json({
                                      error:
                                        "Une erreur est survenue, veuillez rafraichir la page",
                                    });
                                  } else {
                                    return res.status(200).json({
                                      success: "Paiement effectué avec succès",
                                    });
                                  }
                                });
                              }
                            }
                          );
                        }
                      })
                      .catch((error) => {
                        console.error(error);
                      });
                  }
                }
              })
              .catch((err) => {
                return res.status(501).json({
                  error: "Paiement échoué",
                });
              });
          } catch (error) {
            return res.status(501).json({
              error: "Paiement échoué",
            });
          }
        }
      });
    }
  });
};

exports.getListSales = (req, res) => {
  const idUser = req.session.user.id ? req.session.user.id : "";
  const sqlReq = `SELECT * from commandes WHERE id_vendeur =  ?`;

  if (utils.empty(idUser)) {
    return res.status(501).json({ error: "Veuillez vous reconnecter !" });
  } else {
    db.query(sqlReq, [idUser], (error, result) => {
      if (error) {
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
            .json({ error: "Aucune vente n'a été effectuée !" });
        }
      }
    });
  }
};

exports.getListOrders = (req, res) => {
  const idUser = req.session.user.id ? req.session.user.id : "";
  const sqlReq = `SELECT idCommande, noms_produits, qte_produits, prix_total, nom_prenom, adresse, ville, code_postal, creation_date from commandes WHERE id_user =  ?`;

  if (utils.empty(idUser)) {
    return res.status(501).json({ error: "Veuillez vous reconnecter !" });
  } else {
    db.query(sqlReq, [idUser], (error, result) => {
      if (error) {
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
            .json({ error: "Aucune vente n'a été effectuée !" });
        }
      }
    });
  }
};
