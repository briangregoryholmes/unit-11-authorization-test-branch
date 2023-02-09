const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const userController = require('./controllers/userController');
const cookieController = require('./controllers/cookieController');
const sessionController = require('./controllers/sessionController');

const PORT = 3001;

const app = express();

const mongoURI = 'mongodb://127.0.0.1:27017/test';
mongoose.connect(mongoURI);

//Set up security headers
app.use(function (req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; style-src 'self'; frame-src 'self'"
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader(
    'Feature-Policy',
    "geolocation 'none'; midi 'none'; sync-xhr 'none'; microphone 'none'; camera 'none'; magnetometer 'none'; gyroscope 'none'; speaker 'none'; vibrate 'none'; fullscreen 'self'; payment 'none';"
  );
  next();
});

/**
 * Automatically parse urlencoded body content and form data from incoming requests and place it
 * in req.body
 */
app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.use('/client', express.static(path.resolve(__dirname, '../client')));

/**
 * --- Express Routes ---
 * Express will attempt to match these routes in the order they are declared here.
 * If a route handler / middleware handles a request and sends a response without
 * calling `next()`, then none of the route handlers after that route will run!
 * This can be very useful for adding authorization to certain routes...
 */

/**
 * root
 */
app.get('/', cookieController.setCookie, (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/index.html'));
});

/**
 * signup
 */
app.get('/signup', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/signup.html'));
});

app.post(
  '/signup',
  [
    userController.createUser,
    sessionController.startSession,
    cookieController.setSSIDCookie,
  ],
  (req, res) => {
    console.log('sending new user to secret page');
    res.redirect('/secret');
  }
);

/**
 * login
 */
app.post(
  '/login',
  [
    userController.verifyUser,
    sessionController.startSession,
    cookieController.setSSIDCookie,
  ],
  (req, res) => {
    console.log('Sending existing user to secret page');
    res.redirect('/secret');
  }
);

/**
 * Authorized routes
 */
app.get(
  '/secret/users',
  [sessionController.isLoggedIn, userController.getAllUsers],
  (req, res) => {
    console.log('Sending secrets data');
    res.send({ users: res.locals.users });
  }
);

app.get('/secret', sessionController.isLoggedIn, (req, res) => {
  console.log('Giving access to secret');
  res.sendFile(path.resolve(__dirname, '../client/secret.html'));
});

/**
 * 404 handler
 */
app.use('*', (req, res) => {
  res.status(404).send('Not Found');
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send({ error: err });
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...`);
});

module.exports = app;
