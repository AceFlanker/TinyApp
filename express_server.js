//// Dependencies and base global variables ///

const express = require('express');
const methodOverride = require('method-override')
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { generateRandomString, emailCheck, shortURLCheck, urlOwnership, loginCheck, urlsPopulator, urlParser } = require('./helpers.js');


//// Databases ////

const userDatabase = {};
const urlDatabase = {};


//// Middleware Implementation ////
app.use(methodOverride('_method'))
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Thank', 'You']
}));
app.set('view engine', 'ejs');

//// GET Requests ////

// /(root) => urls_login or urls_index
// Root directory redirecting to "/login" (for unknown user) or "/urls" (for logged-in user)
app.get('/', (req, res) => {
  // "loginCheck" returns the associated user object if "session.user_id" corresponds to an "id" in the user database, undefined otherwise
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  // If there is NO user_id cookie, aka the client is not logged in
  !currentUser ? res.redirect('/login') : res.redirect('/urls');
});

// /urls => urls_index
// My URLs - TinyApp Homepage
app.get('/urls', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  if (!currentUser) {
    return res.redirect('/error/401');
  }
  // A list of user created URLs is generated based on the "userID" key in the short URL object
  const userURLs = urlsPopulator(req.session.user_id, urlDatabase);
  const templateVars = { user: currentUser, urls: userURLs };
  res.render('urls_index', templateVars);
});

// /urls/new => urls_new
// Creating a new short URL entry
app.get('/urls/new', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser };
  !currentUser ? res.redirect('/login') : res.render('urls_new', templateVars);
});

// /login =>  urls_login 
// Sign In
app.get('/login', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  // "inputStatus" code for input error prompts (0 = default, 1 = invalid email, 2 = invalid password);
  // "queryEmail" stores the email provided so it stays in the input field in case of an user error.
  const templateVars = { user: currentUser, inputStatus: 0, queryEmail: '' };
  !currentUser ? res.render('urls_login', templateVars): res.redirect('/urls');
});

// /register => urls_register 
// Account Registration
app.get('/register', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  // "empty" stores input field status code (0 = default, 1 = empty email field, 2 = empty password field
  // 3 = duplicate email registration)
  const templateVars = { user: currentUser, empty: 0, queryEmail: '' };
  !currentUser ? res.render('urls_register', templateVars): res.redirect('/urls');
});

// /urls/:shortURL => urls_show 
// Short URL Edit Page
app.get('/urls/:shortURL', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  const queryShortURL = req.params.shortURL;
  if (!currentUser) {
    return res.redirect('/error/401');
  }
  // If the short URL requested is NOT in the database
  if (!shortURLCheck(queryShortURL, urlDatabase)) {
    return res.redirect('/error/404');
  }
  // If the short URL requested does NOT belong to the current user
  if (urlDatabase[queryShortURL].userID !== currentUser.id) {
    return res.redirect('/error/403');
  }
  const querylongURL = urlDatabase[queryShortURL].longURL;
  const timesVisited = Object.keys(urlDatabase[queryShortURL].timeStamps).length || 0;
  const uniqueUsers = Object.keys(urlDatabase[queryShortURL].uniqueUsers).length || 0;
  const visitDates = urlDatabase[queryShortURL].timeStamps;
  const templateVars = {
    user: currentUser,
    shortURL: queryShortURL,
    longURL:querylongURL,
    timesVisited,
    uniqueUsers,
    visitDates,
  };
  res.render('urls_show', templateVars);
});

// /u/:shortURL => http:[longURL]
// Short URL redirecting to its linked external URL
app.get('/u/:shortURL', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  const queryShortURL = req.params.shortURL;
  const longURL = urlDatabase[queryShortURL].longURL;
  if (!shortURLCheck(queryShortURL, urlDatabase)) {
    return res.redirect('/error/404');
  }
  // If the user isn't logged in or doesn't own the short URL, a visitor cookie is set
  if (!currentUser || !urlOwnership(currentUser.id, queryShortURL, urlDatabase)) {
    if (!req.session.visitor_id) {
      req.session.visitor_id = generateRandomString();
    }
    // Timestamping and populating a unique visitor list
    const visitorID = req.session.visitor_id;
    urlDatabase[queryShortURL].timeStamps[Date()] = visitorID;
    urlDatabase[queryShortURL].uniqueUsers[visitorID] = visitorID;
  } else {
    urlDatabase[queryShortURL].timeStamps[Date()] = 'You';
    urlDatabase[queryShortURL].uniqueUsers['You'] = 'You';
  } 
  res.redirect(longURL);
});

// /error/:code => /urls_error 
// Error message page with a relevant message per the "code" parameter from the redirected URL
app.get('/error/:code', (req, res) => {
  const errorCode = req.params.code;
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser, code: errorCode };
  res.status(errorCode).render('urls_error', templateVars);
});


//// POST Requests ////

// Short URL Generation
// Generating new data after user enters a new URL and redirecting to /urls/shortURL
app.post('/urls', (req, res) => {  
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  if (!currentUser) {
    return res.redirect('/error/401');
  }
  const longURL = urlParser(req.body.longURL);
  // A randomly generated string is assigned as the short URL
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: longURL,
    userID: currentUser.id,
    timeStamps: {},
    uniqueUsers: {},
  }
  res.redirect(`/urls/${shortURL}`);
});

// Log In
// Setting a cookie per randomly generated user id and redirecting to /urls 
app.post('/login', (req, res) => {
  const logEmail = req.body.email;
  const logPassword = req.body.password;
  const templateVars = { user: undefined, inputStatus: 0, queryEmail: logEmail };
  // If the email provided is NOT in the user database
  if (!emailCheck(logEmail, userDatabase)) {
    templateVars.inputStatus = 1;
    return res.status(404).render('urls_login', templateVars);
  }
  // emailCheck() also returns the user "id "key in user database
  const logUserID = emailCheck(logEmail, userDatabase); 
  const dbPassword = userDatabase[logUserID].password;
  // If the password provided can NOT be verified by hash authentication
  if (!bcrypt.compareSync(logPassword, dbPassword)) {  
    templateVars.inputStatus = 2;
    return res.status(403).render('urls_login', templateVars);
  }
  req.session.user_id = logUserID;
  res.redirect('/urls');
});

// Registration
// Creating a new user entry in user database per user registration and redirecting to /urls
app.post('/register', (req, res) => {
  const regEmail = req.body.email;
  const regPassword = req.body.password;
  const templateVars = { user: undefined, empty: 0, queryEmail: regEmail };
  if (regEmail === '') {
    templateVars.empty = 1;
    return res.status(400).render('urls_register', templateVars);
  }
  if (regPassword === '') {
    templateVars.empty = 2;
    return res.status(400).render('urls_register', templateVars);
  }
  // If the email address provided already exists in the user database
  if (emailCheck(req.body.email, userDatabase)) {
    templateVars.empty = 3;
    return res.status(409).render('urls_register', templateVars);
  }
  const generatedID = generateRandomString();
  userDatabase[generatedID] = {
    id: generatedID,
    email: regEmail,
    password: bcrypt.hashSync(regPassword, 10),
  }
  req.session.user_id = generatedID;
  res.redirect('/urls');
});

// Log Out
// Clearing user cookie per user logout and redirecting to /urls 
app.post('/logout', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  // If the user is regerested, clears the cookie
  if (currentUser) {
    req.session = null;
  }
  res.redirect('/login');
  // Else keeps the visitor cookie in non-registered users for stat tracking (ethical?), if they are somehow able to send a POST logout request via other means
});

// Edit
// Updating URL database after user edits an existing URL
app.put('/urls/:shortURL', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  const shortURL = req.params.shortURL;
  console.log(shortURL);
  if (!currentUser) {
    return res.redirect('/error/401');
  } 
  // If the short URL requested is NOT in the url database or if the user does NOT own it
  if (!shortURLCheck(shortURL, urlDatabase) || !urlOwnership(currentUser.id, shortURL, urlDatabase)) {
    return res.redirect('/error/404');
  }
  // urlParser() appends an "http://" suffix to the URL provided if necessary
  const newlongURL = urlParser(req.body.edit);
  urlDatabase[shortURL].longURL = newlongURL
  res.redirect('/urls')
});

// Delete
// Deleting an URL from database as per user request and redirecting to /urls
app.delete('/urls/:shortURL/delete', (req, res) => {
  const currentUser = loginCheck(req.session.user_id, userDatabase);
  const shortURL = req.params.shortURL;
  if (!currentUser) {
    return res.redirect('/error/401');
  } 
  if (!shortURLCheck(shortURL, urlDatabase) || !urlOwnership(currentUser.id, shortURL, urlDatabase)) {
    return res.redirect('/error/404');
  }
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});


//// Black Magic ////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});