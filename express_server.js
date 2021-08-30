const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");

const generateRandomString = function() {
  const alphanumberic = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    let randNum = Math.floor(Math.random() * alphanumberic.length);
    randStr += alphanumberic[randNum];
  }
  return randStr;
}

app.use(bodyParser.urlencoded({extended: true}));

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get('/urls', (req, res) => {
  const templateVars = { urls: urlDatabase };
  res.render('urls_index', templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);
  if (req.body.longURL) {
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = req.body.longURL;
    // const templateVars = { shortURL: randURL, longURL: req.body.longURL };
    // res.render('urls_show', templateVars);
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.send('Okay!');
  }
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL] };
  res.render("urls_show", templateVars);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});