const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: "repar-compteur",
    api_key: "465577619821798",
    api_secret: "0yIEdE_b__PwLi4tS2kpyPY_iGQ",
})

module.exports = cloudinary;