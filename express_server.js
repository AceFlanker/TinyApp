const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

const generateRandomString = function() {
  const alphanumberic = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    let randNum = Math.floor(Math.random() * alphanumberic.length);
    randStr += alphanumberic[randNum];
  }
  return randStr;
}

const schemeNegCheck = /^([A-Za-z]+.)+[A-Z-a-z]+(\/?$|\/.+$)/; // Checks if the URL has a scheme/protocol specified


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//// GET REQUESTS

// /urls => urls_index | My URLs (TinyApp Homepage)
app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render('urls_index', templateVars);
});

// /urls/new => urls_new | Create New URL
app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] }
  res.render("urls_new", templateVars);
});

// /u/[shortURL]=> [longURL] | Redirecting Page to an External URL
app.get("/u/:shortURL", (req, res) => {
  console.log(req.params.shortURL);
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// /urls/[shortURL] => urls_show | Individual Registered URL Info / Edit Page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], username: req.cookies["username"] };
  res.render("urls_show", templateVars);
});


//// POST REQUESTS
// Generating new data after user enters a new URL and redirecting to /urls
app.post("/urls", (req, res) => {
  console.log(req.body);
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

// Deleting an URL from database as per user request and redirecting to /urls
app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(req.params.shortURL);
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls')
});

// Updating URL database after user edits an existing URL
app.post("/urls/:shortURL/edit", (req, res) => {
  console.log(req.body);
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

// Setting a cookie per registered username and redirecting to /urls 
app.post("/login", (req, res) => {
  console.log(req.body);
  let subUsername = req.body.username;
  console.log(subUsername);
  res.cookie('username', subUsername);
  res.redirect('/urls');
});

// Clearing user cookie per user log out and redirecting to /urls 
app.post("/logout", (req, res) => {
  console.log(req.body);
  res.clearCookie('username');
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});