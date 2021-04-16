const db = require('../config/dbConf');
const utils = require('../utils');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const saltRounds = 10;

exports.getMarques = (req, res) => {
    const sqlReq = "SELECT DISTINCT marque from voitures ORDER BY marque";
    db.query(sqlReq, (err, result) => {
        if(err) {
            return res.status(500).json({error: 'Une erreur est survenue, veuillez rafraichir la page'});
        }
        else {
            if (result.length > 0) {
                return res.status(200).json({
                    resultat: result,
                });
            } else {
                return res.status(501).json({error: 'La liste des marques est indisponible !'});
            }
        }
    })
};

exports.getModel = (req, res) => {
    const marques = req.body.marques.join('|');
    const sqlReq = `SELECT modele from voitures WHERE REGEXP_LIKE (marque,'^(${marques})$') AND modele != '' AND modele IS NOT NULL`;
    if(!utils.empty(marques)) {
        db.query(sqlReq, [], (err, result) => {
            if(err) {
                return res.status(500).json({error: 'Une erreur est survenue, veuillez rafraichir la page'});
            }
            else {
                if (result.length > 0) {
                    return res.status(200).json({
                        resultat: result,
                    });
                } else {
                    return res.status(501).json({error: 'La liste des marques est indisponible !'});
                }
            }
        })
    }
};

exports.getSearchSelected = (req, res) => {
    const value = req.body.value;
    const sqlReq = "SELECT DISTINCT * from voitures WHERE marque REGEXP ? OR modele REGEXP ?";
    const sqlResLeven = "SELECT DISTINCT * from voitures WHERE (levenshtein( ?, `marque` ) BETWEEN 0 AND 4) OR (levenshtein( ?, `modele` ) BETWEEN 0 AND 4) LIMIT 6";
    db.query(sqlResLeven, [value, value], (err, result) => {
        if(err) {
            console.log(err);
            return res.status(500).json({error: 'Une erreur est survenue, veuillez rafraichir la page'});
        }
        else {
            if (result.length > 0) {
                return res.status(200).json({
                    resultat: result,
                });
            } else {
                return res.status(501).json({error: 'Introuvable !'});
            }
        }
    })
};

exports.getSearchMarques = (req, res) => {
    const value = req.body.value;
    const sqlReq = "SELECT DISTINCT marque from voitures WHERE marque LIKE ? ORDER BY marque";
    if(value) {
        db.query(sqlReq, [value], (err, result) => {
            if(err) {
                console.log(err);
                return res.status(500).json({error: 'Une erreur est survenue, veuillez rafraichir la page'});
            }
            else {
                if (result.length > 0) {
                    return res.status(200).json({
                        resultat: result,
                    });
                } else {
                    return res.status(501).json({error: 'Introuvable !'});
                }
            }
        })
    }
};