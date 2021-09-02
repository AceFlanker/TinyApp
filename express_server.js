const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}));
app.set("view engine", "ejs");

// Regexp that checks if the URL has a scheme/protocol specified
const schemeNegCheck = /^([A-Za-z]+.)+[A-Z-a-z]+(\/?$|\/.+$)/; 

//// Databases ////
const userDatabase = { 
  //   "admin0": {
  //     id: "admin0", 
  //     email: "this_is_an@email.com", 
  //     password: "leavemealone"
  //   },
  //  "Tesla": {
  //     id: "user2RandomID", 
  //     email: "user2@example.com", 
  //     password: "aaa"
  //   }
  }

const urlDatabase = {
  // "b2xVn2": {
  //   longURL: "http://www.lighthouselabs.ca",
  //   userID: 'nobody'
  // },
  // "9sm5xK": {
  //   longURL: "http://www.google.com",
  //   userID: 'nobody'
  // }
};

const sessionDatabase = {
  // '4e6zml': Tesla
}

//// Helper Functins ////

// Random 6-char Alphanumeral Generator
const generateRandomString = function() {
  const alphanumberic = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    let randNum = Math.floor(Math.random() * alphanumberic.length);
    randStr += alphanumberic[randNum];
  }
  return randStr;
}

// Object Value Check
// Generic Boolean checking function for objects
const objCheck = function(queryObj, queryKey, queryValue) {
  for (const key in queryObj) {
    if (queryObj[key][queryKey] === queryValue) {
      return [true, key];
    }
  }
  return false;
}

// Email Check <- Object Value Check
// Checks if an email already exists in the user database
const emailCheck = function(queryEmail) {
  return objCheck(userDatabase, 'email', queryEmail);
};

// Short URL Check
// Checks if provided short URL exists in the URL database
const shortURLCheck = function(queryShortURL) {
  for (const key in urlDatabase) {
    if (key === queryShortURL) {
      return true;
    }
  }
  return false;
}

// Validates short URL ownership
const validateShortURL = function(cookieID, queryShortURL) {
  return urlDatabase[queryShortURL].userID === cookieID ? true : false;
}


// Returns user info object in the user database if user is logged in, undefined if otherwise
const cookieCheck = function(cookieID) {
  return cookieID ? userDatabase[cookieID] : undefined;
} // NOTE: The above returns the ENTIRE USER OBJECT

// Generating a list of user's URLs
const urlsForUser = function(cookieUserID) {
  let urlsObj = {}
  for (const key in urlDatabase) {
    if (urlDatabase[key].userID === cookieUserID) {
      urlsObj[key] = urlDatabase[key];
    }
  }
  return urlsObj;
}

// Assigning user's URL list to the a variable of html/ejs' template object
const urlsTemplate = function(cookie, currentURLs, templateObj) {
  if (cookie) {
    templateObj.urls = currentURLs;
  }
}

//////////////////////////////////////////////////////////////////////////////
//// GET REQUESTS ////

// /urls => urls_index | My URLs (TinyApp Homepage)
app.get('/urls', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  if (currentUser) {
    const userURLs = urlsForUser(req.session.user_id);
    const templateVars = { user: currentUser, urls: {} };
    urlsTemplate(currentUser, userURLs, templateVars);
    res.render('urls_index', templateVars);
  } else {
    // res.sendStatus(400); // Bad request
    res.redirect('/login')
  }
});

// /urls/new => urls_new | Create New URL
app.get("/urls/new", (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  const templateVars = { user: currentUser };
  templateVars.user ? res.render("urls_new", templateVars) : res.redirect('/login');
});

// /register => urls_register | Registration Page
app.get('/register', (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  const templateVars = { user: currentUser };
  templateVars.user ? res.redirect('/urls') : res.render('urls_register', templateVars);
});

// /login =>  urls_login | Login page 
app.get("/login", (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  const templateVars = { user: currentUser };
  templateVars.user ? res.redirect('/urls') : res.render('urls_login', templateVars);
});

// /u/:shortURL=> http:[longURL] | Short URL redirecting Page to an External URL
app.get("/u/:shortURL", (req, res) => {
  const queryShortURL = req.params.shortURL
  if (shortURLCheck(queryShortURL)) {
    const longURL = urlDatabase[queryShortURL].longURL;
    res.redirect(longURL);
  } else {
    res.sendStatus(404); // Not found
  }
});

// /urls/:shortURL => urls_show | Individual Registered URL / Edit Page
app.get("/urls/:shortURL", (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  const queryShortURL = req.params.shortURL;
  if (!currentUser) {
    res.sendStatus(400);
  } else if (urlDatabase[queryShortURL].userID === currentUser.id) {
    const templateVars = { user: currentUser, shortURL: queryShortURL, longURL: urlDatabase[queryShortURL].longURL };
    res.render("urls_show", templateVars);
  } else {
    res.sendStatus(403); // Forbidden
  }
});


//// POST REQUESTS ////

// Short URL Generation
// Generating new data after user enters a new URL and redirecting to /urls/shortURL
app.post("/urls", (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
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
app.post("/urls/:shortURL/delete", (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  const shortURL = req.params.shortURL;
  if (currentUser) { // If user cookie exists, aka logged in
    if (shortURLCheck(shortURL)) { // If the short URL exists in the url database
      if (validateShortURL(currentUser.id, shortURL)) { // If shortURL belongs to current user
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
app.post("/urls/:shortURL/edit", (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  const shortURL = req.params.shortURL;
  if (currentUser) { // If user cookie exists, aka logged in
    if (shortURLCheck(shortURL)) { // If the short URL exists in the url database
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

// Log In
// Setting a cookie per randomly generated user id and redirecting to /urls 
app.post("/login", (req, res) => {
  const logEmail = req.body.email;
  const logPassword = req.body.password;
  let logUserID = emailCheck(logEmail)[1]; // emailCheck() returns the key (user id) in user database
  if (!emailCheck(logEmail)[0]) {
    res.sendStatus(404); // Not found
  } else {
    logUserID = emailCheck(logEmail)[1];
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
app.post("/logout", (req, res) => {
  const currentUser = cookieCheck(req.session.user_id);
  if (currentUser) {
    const sessionID = req.session.user_id;
    delete sessionDatabase[sessionID];
    req.session = null;
    res.redirect('/login');
  } else {
    res.sendStatus(400); // Bad request
  }
});

// Registration
// Creating a new user entry in userDatabase per user registration and redirecting to /urls
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '' || emailCheck(req.body.email)[0]) {
    res.sendStatus(400); // "Bad Request"
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
    console.log(req.session.user_id);
    console.log(generatedID);
    res.redirect('/urls')
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});