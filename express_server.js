const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");

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

// Regexp that checks if the URL has a scheme/protocol specified
const schemeNegCheck = /^([A-Za-z]+.)+[A-Z-a-z]+(\/?$|\/.+$)/; 

// emailCheck

const emailCheck = function(newRegEmail) {
  for (const userObj in userDatabase) {
    if (userDatabase[userObj].email === newRegEmail) {
      return false;
    }
  }
  return true;
}

//// Databases ////

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = { 
  "admin0": {
    id: "admin0", 
    email: "this_is_an@email.com", 
    password: "leavemealone"
  },
 "Tesla": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

//// GET REQUESTS ////

// /urls => urls_index | My URLs (TinyApp Homepage)
app.get('/urls', (req, res) => {
  console.log('cookie:', req.cookies)
  const userInfo = userDatabase[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase, user: userInfo };
  res.render('urls_index', templateVars);
});

// /urls/new => urls_new | Create New URL
app.get("/urls/new", (req, res) => {
  const userInfo = userDatabase[req.cookies["user_id"]];
  const templateVars = { user: userInfo }
  res.render("urls_new", templateVars);
});

// /urls/register => urls_register
app.get('/urls/register', (req, res) => {
  const userInfo = userDatabase[req.cookies["user_id"]];
  const templateVars = { user: userInfo }
  res.render('urls_register', templateVars);
});

// /u/[shortURL]=> [longURL] | Redirecting Page to an External URL
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// /urls/[shortURL] => urls_show | Individual Registered URL Info / Edit Page
app.get("/urls/:shortURL", (req, res) => {
  const userInfo = userDatabase[req.cookies["user_id"]];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: userInfo };
  res.render("urls_show", templateVars);
});

//// POST REQUESTS ////

// Edit redirection
// Generating new data after user enters a new URL and redirecting to /urls
app.post("/urls", (req, res) => {
  if (req.body.longURL) {
    let longURL;
    if (schemeNegCheck.test(req.body.longURL)) {
      longURL = 'http://' + req.body.longURL;
    } else {
      longURL = req.body.longURL;
    }
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = longURL;
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('Okay!');
  }
});

// Delete
// Deleting an URL from database as per user request and redirecting to /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls')
});

// Edit
// Updating URL database after user edits an existing URL
app.post("/urls/:shortURL/edit", (req, res) => {
  const shortURL = req.params.shortURL;
  let newlongURL;
  if (schemeNegCheck.test(req.body.edit)) {
    newlongURL = 'http://' + req.body.edit;
  } else {
    newlongURL = req.body.edit;
  }
  urlDatabase[shortURL] = newlongURL;
  res.redirect('/urls')
});

// Log in
// Setting a cookie per registered username and redirecting to /urls 
app.post("/login", (req, res) => {
  const subUsername = req.body.username;
  res.cookie('user_id', subUsername);
  res.redirect('/urls');
});

// Log out
// Clearing user cookie per user log out and redirecting to /urls 
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});


// Registration
// Creating a new user entry in userDatabase per user registration and redirecting to /urls
app.post("/urls/register", (req, res) => {
  if (req.body.email === '' || req.body.user === '' || !emailCheck(req.body.email)) {
    res.sendStatus(400);
  } else {
    const regEmail = req.body.email;
    const regPassword = req.body.password;
    const generatedID = generateRandomString();
    userDatabase[generatedID] = {
      id: generatedID,
      email: regEmail,
      password: regPassword
    };
    console.log(userDatabase);
    res.cookie('user_id', generatedID);
    res.redirect('/urls')
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});