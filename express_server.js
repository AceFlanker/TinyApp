//// Dependencies and base variables ///

const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { generateRandomString, emailCheck, shortURLCheck, urlOwnership, cookieCheck, urlsForUser, urlParser } = require('./helpers.js');


//// Databases ////

const userDatabase = {};
const urlDatabase = {};


//// Middleware Implementation ////

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['Thank', 'You']
}));
app.set('view engine', 'ejs');


//// GET Requests ////

// / => urls_login or urls_index
// Root directory redirecting to Login (for unknown user) or Index (for logged-in user)
app.get('/', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  if (!currentUser) {
    return res.redirect('/login');
  }
  res.redirect('/urls');
});

// /urls => urls_index
// My URLs - TinyApp Homepage
app.get('/urls', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  if (!currentUser) {
    return res.redirect('/error/401');
  }
  const userURLs = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = { user: currentUser, urls: userURLs };
  res.render('urls_index', templateVars);
});

// /urls/new => urls_new
// Creating a new short URL entry
app.get('/urls/new', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser };
  !currentUser ? res.redirect('/login') : res.render('urls_new', templateVars);
});

// /login =>  urls_login 
// Sign In
app.get('/login', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser, inputStatus: 0, queryEmail: '' };
  !currentUser ? res.render('urls_login', templateVars): res.redirect('/urls');
});

// /register => urls_register 
// Account Registration
app.get('/register', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const templateVars = { user: undefined, empty: 0, queryEmail: '' };
  !currentUser ? res.render('urls_register', templateVars): res.redirect('/urls');
});

// /urls/:shortURL => urls_show 
// Short URL Edit Page
app.get('/urls/:shortURL', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const queryShortURL = req.params.shortURL;
  if (!currentUser) {
    return res.redirect('/error/401');
  }
  if (!shortURLCheck(queryShortURL, urlDatabase)) {
    return res.redirect('/error/404');
  }
  if (urlDatabase[queryShortURL].userID !== currentUser.id) {
    return res.redirect('/error/403');
  }
  const templateVars = { user: currentUser, shortURL: queryShortURL, longURL: urlDatabase[queryShortURL].longURL };
  res.render('urls_show', templateVars);
});

// /u/:shortURL => http:[longURL]
// Short URL redirecting to its linked external URL
app.get('/u/:shortURL', (req, res) => {
  const queryShortURL = req.params.shortURL
  if (!shortURLCheck(queryShortURL, urlDatabase)) {
    return res.redirect('/error/404');
  }
  const longURL = urlDatabase[queryShortURL].longURL;
  res.redirect(longURL);
});

// /error/:code => /urls_error 
// Error message page with relevant message from code parameter of redirected URL
app.get('/error/:code', (req, res) => {
  const errorCode = req.params.code;
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser, code: errorCode };
  res.status(errorCode).render('urls_error', templateVars);
});


//// POST Requests ////

// Short URL Generation
// Generating new data after user enters a new URL and redirecting to /urls/shortURL
app.post('/urls', (req, res) => {  
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  if (!currentUser) {
    return res.redirect('/error/401');
  }
  const longURL = urlParser(req.body.longURL);
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL: longURL, userID: currentUser.id }
  res.redirect(`/urls/${shortURL}`);
});

// Log In
// Setting a cookie per randomly generated user id and redirecting to /urls 
app.post('/login', (req, res) => {
  const logEmail = req.body.email;
  const logPassword = req.body.password;
  const templateVars = { user: undefined, inputStatus: 0, queryEmail: logEmail };
  if (!emailCheck(logEmail, userDatabase)) {
    templateVars.inputStatus = 1;
    return res.status(404).render('urls_login', templateVars);
  }
  // emailCheck() returns the key (user id) in user database
  const logUserID = emailCheck(logEmail, userDatabase); 
  const dbPassword = userDatabase[logUserID].password; 
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
// Clearing user cookie per user log out and redirecting to /urls 
app.post('/logout', (req, res) => {
    req.session = null;
    res.redirect('/login');
});

// Edit
// Updating URL database after user edits an existing URL
app.post('/urls/:shortURL', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const shortURL = req.params.shortURL;
  if (!currentUser) {
    return res.redirect('/error/401');
  } 
  if (!shortURLCheck(shortURL, urlDatabase) || !urlOwnership(currentUser.id, shortURL, urlDatabase)) {
    return res.redirect('/error/404');
  }
  const newlongURL = urlParser(req.body.edit);
  urlDatabase[shortURL].longURL = newlongURL
  res.redirect('/urls')
});

// Delete
// Deleting an URL from database as per user request and redirecting to /urls
app.post('/urls/:shortURL/delete', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
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