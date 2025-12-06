// index.js
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const connectEnsureLogin = require('connect-ensure-login');

const app = express();

/* ---------- EXPRESS SETUP ---------- */

app.use(express.static(__dirname)); // so /html and /css are served

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

/* ---------- MONGOOSE SETUP ---------- */

mongoose
  .connect('mongodb://127.0.0.1:27017/MyDatabase')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

/* ---------- USER SCHEMA ---------- */

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model('userInfo', userSchema, 'userInfo');

/* ---------- PASSPORT LOCAL STRATEGY ---------- */

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* ---------- ROUTES ---------- */

// POST /login – authenticate
app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login?info=Invalid%20username%20or%20password',
  })
);

// GET /login – login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'html', 'login.html'));
});

// GET / – home page (protected)
app.get(
  '/',
  connectEnsureLogin.ensureLoggedIn(),
  (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
  }
);

// GET /private – private page (protected)
app.get(
  '/private',
  connectEnsureLogin.ensureLoggedIn(),
  (req, res) => {
    res.sendFile(path.join(__dirname, 'html', 'private.html'));
  }
);

// GET /user – return logged-in user JSON
app.get(
  '/user',
  connectEnsureLogin.ensureLoggedIn(),
  (req, res) => {
    res.json({ username: req.user.username });
  }
);

// GET /logout – end session
app.get('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    res.redirect('/login');
  });
});

/* ---------- SEED USERS (RUN ONCE) ---------- */

// Run once to create users, then comment these out
//User.register(new User({ username: 'paul' }), 'paul');
//User.register(new User({ username: 'sarah' }), 'sarah');
//User.register(new User({ username: 'john' }), 'john');

/* ---------- START SERVER ---------- */

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log('App listening on port ' + port);
});
