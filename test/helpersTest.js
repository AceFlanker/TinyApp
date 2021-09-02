const { assert } = require('chai');

const { emailCheck } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = emailCheck("user@example.com", testUsers)
    const expectedOutput = "userRandomID";
    assert.strictEqual(user, expectedOutput);
  });
  it('should return a user with valid email', function() {
    const user = emailCheck("user2@example.com", testUsers)
    const expectedOutput = "user2RandomID";
    assert.strictEqual(user, expectedOutput);
  });
  it('should return false', function() {
    const user = emailCheck("user3@example.com", testUsers)
    const expectedOutput = "user2RandomID";
    assert.notStrictEqual(user, expectedOutput);
  });
});