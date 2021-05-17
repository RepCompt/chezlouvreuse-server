const express = require('express');
require('dotenv').config();
const fileupload = require('express-fileupload');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
let MySQLStore = require('express-mysql-session')(session);
require('dotenv').config();

const userRoutes = require('./routes/user');
const voituresRoutes = require('./routes/voitures');
const productsRoutes = require('./routes/products');
const purchaseRoutes = require('./routes/purchase');
const db = require('./config/dbConf');

const app = express();

app.use(fileupload({
  useTempFiles: true
}));
app.use(express.json());
app.use(cors({
    origin: ["https://v2.piecedecompteur.fr/chezlouvreuse/#/"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true
}));
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

let sessionStore = new MySQLStore({}, db);

app.use(
  session({
    key: "userID",
    secret: process.env.RANDOM_KEY_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 30 * 12 * 86400 * 1000,
    },
  })
);

app.use('/api/louvreuse/user', userRoutes);
app.use('/api/louvreuse/voitures', voituresRoutes);
app.use('/api/louvreuse/products', productsRoutes);
app.use('/api/louvreuse/purchase', purchaseRoutes);


module.exports = app;