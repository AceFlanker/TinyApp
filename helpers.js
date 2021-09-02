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

// Email Check
// Checks if an email already exists in the user database
// NOTE this is the getUserByEmail() funcion that the instructions requested with name changed
const emailCheck = function(queryEmail, sourceDatabase) {
  for (const userID in sourceDatabase) {
    return sourceDatabase[userID].email === queryEmail ? key : undefined;
  }
};

// Short URL Check
// Checks if provided short URL exists in the URL database
const shortURLCheck = function(queryShortURL, sourceDatabase) {
  for (const key in sourceDatabase) {
    return key === queryShortURL ? true : false;
  }
};

// URL Ownership Validation
// Validates short URL ownership
const validateShortURL = function(cookieID, queryShortURL, sourceDatabase) {
  return sourceDatabase[queryShortURL].userID === cookieID ? true : false;
};

// Log-in check
// Returns user info object from database if logged in, undefined if otherwise
const cookieCheck = function(cookieID, sourceDatabase) {
  return cookieID ? sourceDatabase[cookieID] : undefined;
};

// User URL List
// Generating a list of user URLs
const urlsForUser = function(cookieUserID, sourceDatabase) {
  let urlsObj = {}
  for (const key in sourceDatabase) {
    if (sourceDatabase[key].userID === cookieUserID) {
      urlsObj[key] = sourceDatabase[key];
    }
  }
  return urlsObj;
}

module.exports = {
  generateRandomString,
  emailCheck,
  shortURLCheck,
  validateShortURL,
  cookieCheck,
  urlsForUser
}