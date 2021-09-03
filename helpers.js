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
    if (sourceDatabase[userID].email === queryEmail) {
      return userID;
    }
  }
  return undefined;
};

// Short URL Check
// Checks if provided short URL exists in the URL database
const shortURLCheck = function(queryShortURL, sourceDatabase) {
  for (const shortURL in sourceDatabase) {
    if (shortURL === queryShortURL) {
      return true;
    }
  }
  return false;
};

// URL Ownership Validation
// Validates short URL ownership
const urlOwnership = function(cookieID, queryShortURL, sourceDatabase) {
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
  for (const shortURL in sourceDatabase) {
    if (sourceDatabase[shortURL].userID === cookieUserID) {
      urlsObj[shortURL] = sourceDatabase[shortURL];
    }
  }
  return urlsObj;
}

// URL Parser
// Checks if the provided URL contains an "http://" suffix, and adds one if not
const urlParser = function(newLongURL) {
  // RegExp that checks if the URL does NOT have a scheme/protocol specified
  const schemeNegCheck = /^([A-Za-z]+.)+[A-Z-a-z]+(\/?$|\/.+$)/;
  let longURL;
  if (schemeNegCheck.test(newLongURL)) { // Checks if a protocol prefixes the new URL
    return 'http://' + newLongURL;
  } else {
    return newLongURL;
  }
}



module.exports = {
  generateRandomString,
  emailCheck,
  shortURLCheck,
  urlOwnership,
  cookieCheck,
  urlsForUser,
  urlParser
}