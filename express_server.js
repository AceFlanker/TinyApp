//// Dependencies and base variables ///

const express = require('express');
const app = express();
const PORT = 8080;
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const { generateRandomString, emailCheck, shortURLCheck, validateShortURL, cookieCheck, urlsForUser } = require('./helpers.js');


//// Databases ////

const userDatabase = {};
const urlDatabase = {};


//// Regular Expressions ////

// RegExp that checks if the URL does not a scheme/protocol specified
const schemeNegCheck = /^([A-Za-z]+.)+[A-Z-a-z]+(\/?$|\/.+$)/; 


//// Express Implementation ////

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.set('view engine', 'ejs');


//// GET Requests ////

// /register => urls_register | Account Registration
app.get('/register', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser };
  templateVars.user ? res.redirect('/urls') : res.render('urls_register', templateVars);
});

// /login =>  urls_login | Sign In
app.get('/login', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser };
  templateVars.user ? res.redirect('/urls') : res.render('urls_login', templateVars);
});

// /urls => urls_index | My URLs - TinyApp Homepage
app.get('/urls', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  if (currentUser) {
    const userURLs = urlsForUser(req.session.user_id, urlDatabase);
    const templateVars = { user: currentUser, urls: userURLs };
    res.render('urls_index', templateVars);
  } else {
    // res.sendStatus(400); // Bad request
    res.redirect('/login')
  }
});

// /urls/new => urls_new | Create New URL
app.get('/urls/new', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const templateVars = { user: currentUser };
  templateVars.user ? res.render('urls_new', templateVars) : res.redirect('/login');
});

// /urls/:shortURL => urls_show | Individual Registered Short URL / Edit
app.get('/urls/:shortURL', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const queryShortURL = req.params.shortURL;
  if (shortURLCheck(queryShortURL, urlDatabase)) {
    if (!currentUser) {
      res.sendStatus(400);
    } else if (urlDatabase[queryShortURL].userID === currentUser.id) {
      const templateVars = { user: currentUser, shortURL: queryShortURL, longURL: urlDatabase[queryShortURL].longURL };
      res.render('urls_show', templateVars);
    } else {
      res.sendStatus(403); // Forbidden
    } 
  } else {
    res.sendStatus(404); // Not found
  }
});

// /u/:shortURL => http:[longURL] | Short URL redirecting to an External URL
app.get('/u/:shortURL', (req, res) => {
  const queryShortURL = req.params.shortURL
  if (shortURLCheck(queryShortURL, urlDatabase)) {
    const longURL = urlDatabase[queryShortURL].longURL;
    res.redirect(longURL);
  } else {
    res.sendStatus(404); // Not found
  }
});


//// POST Requests ////

// Registration
// Creating a new user entry in userDatabase per user registration and redirecting to /urls
app.post('/register', (req, res) => {
  if (req.body.email === '' || req.body.password === '' || emailCheck(req.body.email, userDatabase)) {
    res.sendStatus(400); // Bad Request
  } else {
    const regEmail = req.body.email;
    const regPassword = req.body.password;
    const generatedID = generateRandomString();
    userDatabase[generatedID] = {
      id: generatedID,
      email: regEmail,
      password: bcrypt.hashSync(regPassword, 10),
    };
    req.session.user_id = generatedID;
    res.redirect('/urls')
  }
});

// Log In
// Setting a cookie per randomly generated user id and redirecting to /urls 
app.post('/login', (req, res) => {
  const logEmail = req.body.email;
  const logPassword = req.body.password;
  let logUserID; // emailCheck() returns the key (user id) in user database
  if (!emailCheck(logEmail, userDatabase)) {
    res.sendStatus(404); // Not found
  } else {
    logUserID = emailCheck(logEmail, userDatabase);
    const dbPassword = userDatabase[logUserID].password;
    if (!bcrypt.compareSync(logPassword, dbPassword)) {
      res.sendStatus(403); // Forbidden
    } else {
    req.session.user_id = logUserID
    res.redirect('/urls');
    }
  }
});

// Log Out
// Clearing user cookie per user log out and redirecting to /urls 
app.post('/logout', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  if (currentUser) {
    const sessionID = req.session.user_id;
    req.session = null;
    res.redirect('/login');
  } else {
    res.sendStatus(400); // Bad request
  }
});

// Short URL Generation
// Generating new data after user enters a new URL and redirecting to /urls/shortURL
app.post('/urls', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  if (currentUser) {
    const newLongURL = req.body.longURL;
    let longURL;
    if (schemeNegCheck.test(newLongURL)) { // Checks if a protocol prefixes the new URL
      longURL = 'http://' + newLongURL;
    } else {
      longURL = newLongURL;
    }
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      longURL: longURL,
      userID: currentUser.id
    }
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.sendStatus(400); // Bad request
  }
});

// Delete
// Deleting an URL from database as per user request and redirecting to /urls
app.post('/urls/:shortURL/delete', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const shortURL = req.params.shortURL;
  if (currentUser) { // If user cookie exists, aka logged in
    if (shortURLCheck(shortURL, urlDatabase)) { // If the short URL exists in the url database
      if (validateShortURL(currentUser.id, shortURL, urlDatabase)) { // If shortURL belongs to current user
        delete urlDatabase[shortURL];
        res.redirect('/urls');
      } else { // If shortURL doesn't belong to current user (not possible using browser?)
        res.sendStatus(403); // Forbidden
      }
    } else { // If shortURL not in database
      res.sendStatus(404) // Not found
    }
  } else { // If user cookie doesn't exist, aka not logged in
    res.redirect('/login')
  }
});

// Edit
// Updating URL database after user edits an existing URL
app.post('/urls/:shortURL/edit', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id, userDatabase);
  const shortURL = req.params.shortURL;
  if (currentUser) { // If user cookie exists, aka logged in
    if (shortURLCheck(shortURL, urlDatabase)) { // If the short URL exists in the url database
        let newlongURL;
        if (schemeNegCheck.test(req.body.edit)) { // Checks if a protocol prefixes the new URL
          newlongURL = 'http://' + req.body.edit;
        } else {
          newlongURL = req.body.edit;
        }
        urlDatabase[shortURL].longURL = newlongURL
        res.redirect('/urls')
    } else { // If shortURL not in database
      res.sendStatus(404) // Not found
    }
  } else { // If user cookie doesn't exist, aka not logged in
    res.redirect('/login')
  }
});


//// Black Magic ////

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});