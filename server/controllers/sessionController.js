const Session = require('../models/sessionModel');
const jwt = require('jsonwebtoken');

const sessionController = {};

/**
 * isLoggedIn - find the appropriate session for this request in the database, then
 * verify whether or not the session is still valid.
 */
sessionController.isLoggedIn = (req, res, next) => {
  console.log('Checking cookies');

  const cookie = req.cookies.ssid;
  console.log({ cookie });

  if (!cookie) return res.redirect('/signup');

  //JWT SESSIONS
  // jwt.verify(cookie, 'c0d3sm1th', (err, decoded) => {
  //   if (err) {
  //     console.log(err);
  //     return res.redirect('/signup');
  //   }
  //   const authedUser = decoded.id;
  //   req.locals.authedUser = authedUser;
  //   console.log({ decoded });
  //   return next();
  // });

  //MONGODB BASED SESSIONS
  Session.findOne({ cookieId: cookie }, (err, session) => {
    console.log({ session });
    if (err) {
      return next(
        'Error in sessionController.isLoggedIn: ' + JSON.stringify(err)
      );
    }

    if (!session) {
      console.log('No session found');
      return res.redirect('/signup');
    }

    res.locals.user = session;
    return next();
  });
};

/**
 * startSession - create and save a new Session into the database.
 */
sessionController.startSession = (req, res, next) => {
  //JWT BASED SESSIONS
  // console.log('Starting session using JWT');
  // const session = {
  //   id: res.locals.user.id,
  //   username: res.locals.user.username,
  // };
  // console.log(session);

  // const token = jwt.sign(session, 'c0d3sm1th', {
  //   expiresIn: '30s',
  // });
  // console.log({ token });
  // res.locals.token = token;
  // return next();

  //MONGODB BASED SESSIONS
  // Check if user already has a session
  Session.findOne({ cookieId: res.locals.user.id }, (err, session) => {
    if (err)
      return next(
        'Error in sessionController.startSession: ' + JSON.stringify(err)
      );

    if (session) {
      //Update session expiration
      console.log('Extending existing session');
      session.createdAt = Date.now();
      session.save();
      return next();
    } else {
      console.log('creating new session');
      Session.create({ cookieId: res.locals.user.id }, (err, session) => {
        if (err)
          return next(
            'Error in sessionController.startSession: ' + JSON.stringify(err)
          );
        return next();
      });
    }
  });
};

module.exports = sessionController;
