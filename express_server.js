var express = require("express");
var app = express();
var PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
var cookieSession = require('cookie-session')
app.use(cookieSession({
  name: 'session',
  keys: ['googlegoggles'],
}))
const bcrypt = require('bcrypt');

app.set("view engine", "ejs");

function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 5; i++){
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

const users = {};

var urlDatabase = {};

function urlsForUser(id){
  usersUrls = {};
  for (key in urlDatabase){
    if (urlDatabase[key]['userID'] === id){
      usersUrls[key] = urlDatabase[key]['longURL']
    }
  }
  return usersUrls;
}

app.get("/urls", (req, res) => {
  let username = req.session.userID;
  let usersUrls = urlsForUser(username);
  let templateVars = {
    username: undefined,
    email: undefined,
    urls: undefined,
  }
  if (username !== undefined){
    templateVars.username = username
    templateVars.urls = usersUrls
    templateVars.email = users[username]['email']
  }
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let username = req.session.userID;
  let templateVars = {
    username: undefined,
    email: undefined,
  }
  if (username !== undefined){
    templateVars = {
      username: username,
      email: users[username]['email']
    }
  }
  res.render("urls_new", templateVars);
});


app.get("/", (req, res) => {
  res.redirect("http://localhost:" + PORT +"/urls/");
});

app.get("/register", (req, res) => {
  let templateVars = {
    username: undefined,
    email: undefined,
    displayError: false,
    displayEmailError: false,
  };
  res.render("urls_register", templateVars)
});

app.post("/register", (req, res) => {
  let userID = 'user' + generateRandomString();
  let password = bcrypt.hashSync(req.body.password, 10);
  let email = req.body.email;
  for (var person in users){
    if (users[person]['email'] === email){
      let templateVars = {
        email: undefined,
        displayEmailError: true,
        displayError: false
      }
      res.render('urls_register', templateVars)
    }
  }
  if (!email || !password){
    let templateVars = {
      email: undefined,
      displayError: true,
      displayEmailError: false
    }
    res.render('urls_login', templateVars)
  } else {
    users[userID] = {
    id: userID,
    email: email,
    password: password
    }
  req.session.userID = userID
  res.redirect("http://localhost:" + PORT +"/urls/")
  };
});

app.get("/login", (req, res) => {
  let username = req.session.userID;
  let templateVars = {
    username: undefined,
    email: undefined,
    urls: undefined,
    displayError: false
  }
  if (username !== undefined){
    templateVars.username = username
    templateVars.email = users[username]['email']
  }
  res.render("urls_login", templateVars);
});

app.post("/login", (req, res) =>{
  let userID = req.session.userID;
  let email = req.body.email;
  let password = req.body.password;
  let matchFound = false;
  let templateVars = {
    email: email,
    displayError: false
  }
  for (var person in users){
    if (users[person]['email'] === email && bcrypt.compareSync(password, users[person]['password'])){
      req.session.userID = users[person]['id']
      matchFound = true
    }
  }
  if(matchFound === false){
    console.log('this ran')
    templateVars = {
      email: undefined,
      displayError: true
    }
    res.render("urls_login", templateVars)
  }
  res.redirect("http://localhost:" + PORT + "/urls/");
});

app.post("/urls", (req, res) => {
  let userID = req.session.userID;
  var shortURL = generateRandomString();
  var longURL = req.body.longURL;
  urlDatabase[shortURL] = {
    userID : userID,
    longURL : longURL
  }
  res.redirect('http://localhost:'+ PORT +'/urls/' + shortURL);
});

app.get("/u/:shortURL", (req, res) => {
  var shortURL = req.params.shortURL;
  var longURL = urlDatabase[shortURL]['longURL'];
  res.redirect('http://'+longURL);
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("http://localhost:" + PORT +"/urls/");
})

app.get("/urls/:id", (req, res) => {
  var shortURL = req.params.id;
  var currentUser = req.session.userID;
  var urlOwner = urlDatabase[shortURL]['userID'];
  let templateVars = {
    username: undefined,
    email: undefined,
    urls: undefined,
  }
  if (urlOwner === currentUser){
    templateVars = {
      shortURL: req.params.id, urlDatabase,
      longURL: urlDatabase[shortURL]['longURL'],
      username: currentUser,
      email: users[currentUser]['email'],
      verifier: urlDatabase[shortURL]['userID']
    }
  }
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  let longURL = req.body.longURL;
  let userID = req.session.userID;
  urlDatabase[shortURL]['longURL'] = longURL;
  res.redirect("http://localhost:"+ PORT +"/urls/");
});

app.post("/urls/:id/delete", (req, res) =>{
  var shortURL = req.params.id;
  delete urlDatabase[shortURL];
  res.redirect('http://localhost:' + PORT +'/urls/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});