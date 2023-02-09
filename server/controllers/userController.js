const User = require('../models/userModel');

const userController = {};

/**
 * getAllUsers - retrieve all users from the database and stores it into res.locals
 * before moving on to next middleware.
 */
userController.getAllUsers = (req, res, next) => {
  console.log('getting users');
  User.find({}, (err, users) => {
    // if a database error occurs, call next with the error message passed in
    // for the express global error handler to catch
    if (err)
      return next(
        'Error in userController.getAllUsers: ' + JSON.stringify(err)
      );

    // store retrieved users into res.locals and move on to next middleware
    res.locals.users = users;
    return next();
  });
};

/**
 * createUser - create and save a new User into the database.
 */
userController.createUser = (req, res, next) => {
  console.log('Creating user');
  console.log(req.body);

  if (!req.body.username || !req.body.password) {
    return next('Error: Missing username or password');
  }

  User.create(req.body, (err, user) => {
    if (err)
      return next('Error in userController.createUser: ' + JSON.stringify(err));
    res.locals.user = user;
    return next();
  });
};

/**
 * verifyUser - Obtain username and password from the request body, locate
 * the appropriate user in the database, and then authenticate the submitted password
 * against the password stored in the database.
 */
userController.verifyUser = (req, res, next) => {
  console.log("Verifying user's credentials");
  const { username, password } = req.body;
  console.log({ username });

  if (!username) return res.redirect('/signup');

  User.findOne({ username }, async (err, user) => {
    console.log('Plain password', password);
    console.log('Found user:', user);

    if (!user) return res.redirect('/signup');

    const success = await user.comparePassword(password);
    console.log({ success });

    if (!success) return res.redirect('/signup');

    res.locals.user = user;
    next();
  });
};

module.exports = userController;
