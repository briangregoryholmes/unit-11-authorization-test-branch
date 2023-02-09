const cookieController = {};

/**
 * setCookie - set a cookie with a random number
 */
cookieController.setCookie = (req, res, next) => {
  console.log('Setting cookie');
  res.cookie('codesmith', 'hi');
  res.cookie('secret', Math.floor(Math.random() * 99));
  next();
};

/**
 * setSSIDCookie - store the user id in a cookie
 */
cookieController.setSSIDCookie = (req, res, next) => {
  //JWT TOKEN COOKIE
  // res.cookie('ssid', res.locals.token, { httpOnly: true });
  // next();

  //MONGODB DOCUMENT ID COOKIE
  console.log('Setting SSID cookie with value', res.locals.user.id);
  res.cookie('ssid', res.locals.user.id, { httpOnly: true });

  next();
};

module.exports = cookieController;
