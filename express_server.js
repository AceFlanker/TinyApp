const express = require("express");
const app = express();
const PORT = 8080;
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs");


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
const emailCheck = function(queryEmail) {
  return objCheck(userDatabase, 'email', queryEmail);
};

// Short URL Check
const shortURLCheck = function(queryShortURL) {
  for (const key in urlDatabase) {
    if (key === queryShortURL) {
      return true;
    }
  }
  return false;
}

// Cookie Template Varaible Check
const cookieVar = function(cookie, templateObj) {
  if (cookie) {
    const user_id = cookie
    templateObj.user = userDatabase[user_id];
  }
}



//// GET REQUESTS ////

// /urls => urls_index | My URLs (TinyApp Homepage)
app.get('/urls', (req, res) => {
  const templateVars = { user: undefined, urls: urlDatabase };
  cookieVar(req.cookies.user_id, templateVars);
  res.render('urls_index', templateVars);
});

// /urls/new => urls_new | Create New URL
app.get("/urls/new", (req, res) => {
  const templateVars = { user: undefined };
  cookieVar(req.cookies.user_id, templateVars);
  templateVars.user ? res.render("urls_new", templateVars) : res.redirect('/login');
});

// /register => urls_register
app.get('/register', (req, res) => {
  const templateVars = { user: undefined };
  cookieVar(req.cookies.user_id, templateVars);
  templateVars.user ? res.redirect('/urls') : res.render('urls_register', templateVars);
});

// /login =>  urls_login | Login page 
app.get("/login", (req, res) => {
  const templateVars = { user: undefined };
  cookieVar(req.cookies.user_id, templateVars);
  templateVars.user ? res.redirect('/urls') : res.render('urls_login', templateVars);
});

// /u/[shortURL]=> [longURL] | Short URL redirecting Page to an External URL
app.get("/u/:shortURL", (req, res) => {
  if (shortURLCheck(req.params.shortURL)) {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } else {
    res.sendStatus(404); // Not found
  }
});

// /urls/[shortURL] => urls_show | Individual Registered URL / Edit Page
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: undefined, shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  cookieVar(req.cookies.user_id, templateVars);
  res.render("urls_show", templateVars);
});

//// POST REQUESTS ////

// Short URL Generation
// Generating new data after user enters a new URL and redirecting to /urls/shortURL
app.post("/urls", (req, res) => {
  if (req.cookies.user_id) {
    if (req.body.longURL) {
      let longURL;
      if (schemeNegCheck.test(req.body.longURL)) {
        longURL = 'http://' + req.body.longURL;
      } else {
        longURL = req.body.longURL;
      }
      const shortURL = generateRandomString();
      urlDatabase[shortURL] = {
        longURL: longURL,
        userID: req.cookies.user_id
      }
      res.redirect(`/urls/${shortURL}`);
    }
  } else {
    res.sendStatus(403); // Forbidden
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
  urlDatabase[shortURL].longURL = newlongURL
  res.redirect('/urls')
});

// Log In
// Setting a cookie per randomly generated user id and redirecting to /urls 
app.post("/login", (req, res) => {
  const logEmail = req.body.email;
  const logPassword = req.body.password;
  const logUserID = emailCheck(logEmail)[1];
  if (!emailCheck(logEmail)[0] || userDatabase[logUserID].password !== logPassword) {
    res.sendStatus(403); // "Forbidden"
  } else {
    res.cookie('user_id', logUserID);
    res.redirect('/urls');
  }
});

// Log Out
// Clearing user cookie per user log out and redirecting to /urls 
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
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
      password: regPassword
    };
    res.cookie('user_id', generatedID);
    res.redirect('/urls')
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});