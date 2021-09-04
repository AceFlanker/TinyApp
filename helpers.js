// Random 6-char Alphanumeral Generator
// Returns a 6-character string mixed of alphabets and numbers
const generateRandomString = function() {
  const alphanumberic = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let randStr = '';
  for (let i = 0; i < 6; i++) {
    let randNum = Math.floor(Math.random() * alphanumberic.length);
    randStr += alphanumberic[randNum];
  }
  return randStr;
};

// Email Check
// Checks if email already exists in user database
// NOTE this is the getUserByEmail() funcion that the client (i.e. customer) requested but with a different name
const emailCheck = function(queryEmail, sourceDatabase) {
  for (const userID in sourceDatabase) {
    if (sourceDatabase[userID].email === queryEmail) {
      return userID;
    }
  }
  return undefined;
};

// Short URL Check
// Checks if provided short URL exists in URL database
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
const urlOwnership = function(loginID, queryShortURL, sourceDatabase) {
  return sourceDatabase[queryShortURL].userID === loginID ? true : false;
};

// Login Status Check
// Returns the required user info object from database if user is logged in, or undefined if not
//Returned data will be passed as a variable to the rendered HTML document
const loginCheck = function(loginID, sourceDatabase) {
  return sourceDatabase[loginID] ? sourceDatabase[loginID] : undefined;
};

// User URL List
// Generating a list of URLs from URL database based on associated user id
const urlsPopulator = function(loginUserID, sourceDatabase) {
  let urlsObj = {};
  for (const shortURL in sourceDatabase) {
    if (sourceDatabase[shortURL].userID === loginUserID) {
      urlsObj[shortURL] = sourceDatabase[shortURL];
    }
  }
  return urlsObj;
};

// URL Parser
// Checks if provided URL contains an "http://" suffix and adds one if not
const urlParser = function(newLongURL) {
  // Negative check - RegExp that checks if the URL does NOT have a scheme/protocol specified
  const schemeNegCheck = /^([A-Za-z]+.)+[A-Z-a-z]+(\/?$|\/.+$)/;
  // Checks if a protocol prefixes the new URL, if not, "http://" is added
  return schemeNegCheck.test(newLongURL) ? 'http://' + newLongURL : newLongURL;
};

module.exports = {
  generateRandomString,
  emailCheck,
  shortURLCheck,
  urlOwnership,
  loginCheck,
  urlsPopulator,
  urlParser
};