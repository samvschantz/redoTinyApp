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

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
  }

const users = {
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
}

var urlDatabase = {
  "x2d4f" : {
    userID : 'userRandomID',
    longURL : "http://www.lighthouse.ca",
  },
  "x3rt3" : {
    userID : 'user2RandomID',
    longURL : "http://www.google.ca",
  },
  "7gf65" : {
    userID : 'user2RandomID',
    longURL : "http://www.amazon.ca",
  },
}

function urlsForUser(id){
  usersUrls = {};
  for (key in urlDatabase){
    if (urlDatabase[key]['userID'] === id){
      usersUrls[key] = urlDatabase[key]['longURL']
    }
  }
  return usersUrls
}

app.get("/", (req, res) => {
  res.end("Hello!");
});

app.get("/register", (req, res) => {
  let templateVars = {
    //username: req.cookies['userID']
    username: undefined,
    email: undefined
  };
  console.log(templateVars)
  res.render("urls_register", templateVars)
});

app.post("/register", (req, res) => {
  let userID = 'user' + generateRandomString()
  let password = bcrypt.hashSync(req.body.password, 10);
  let email = req.body.email
  for (var person in users){
    if (users[person]['email'] === email){
      res.sendStatus(400)
    } else if (users[person]['password'] === password){
      res.sendStatus(400)
    }
  };
  // checks whether email or password field are filled in
  if (!email || !password){
    res.sendStatus(400)
  } else {
    users[userID] = {
      id: userID,
      email: email,
      password: password
    };
    //res.cookie("userID", userID)
    req.session.userID = userID
    res.redirect("http://localhost:8080/urls/")
  };
});

app.get("/login", (req, res) => {
  res.render("urls_login")
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let username = req.session.userID;
  let usersUrls = urlsForUser(username)
  console.log('This is users urls ' + usersUrls)
  let templateVars = {}                         //urlDatabase fix
  if (req.session.userID === null){
    templateVars.username = null
    templateVars.email = null
    templateVars.urls = null
  } else {
    console.log('this ran')
    console.log('this is the urlDatabase ' + JSON.stringify(urlDatabase))
    templateVars.username = username
    templateVars.urls = usersUrls
    templateVars.email = users[username]['email']
  };
  console.log('these are the template vars ' + JSON.stringify(templateVars))
  res.render("urls_index", templateVars)
});

app.get("/urls/new", (req, res) => {
  let username = req.session.userID
  if (req.session.userID === null){
    res.redirect("http://localhost:8080/login")
  }
  let templateVars = {
    username: username,
    email: users[username]['email']
  };
    res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  //let userID = req.cookies.userID
  let userID = req.session.userID
  var shortURL = generateRandomString()
  var longURL = req.body.longURL
  urlDatabase[shortURL] = {
    userID : userID,
    longURL : longURL
  }         //these are fixed
  res.redirect('http://localhost:8080/urls/' + shortURL);
});

app.get("/u/:shortURL", (req, res) => {
  var shortURL = req.params.shortURL
  var longURL = urlDatabase[shortURL]['longURL']
  res.redirect('http://'+longURL)
});

app.post("/logout", (req, res) => {
  req.session.userID = null
  res.redirect("http://localhost:8080/register/")
})

app.get("/urls/:id", (req, res) => {
  //var username = req.cookies['userID']
  var username = req.session.userID
  let templateVars = {
    shortURL: req.params.id, urlDatabase,            //uses urlDatabase
    username: username,
    email: users[username]['email'] //this is where you left it last night
    };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id
  let longURL = req.body.longURL
  //let userID = req.cookies.userID
  let userID = req.session.userID
  urlDatabase[userID][shortURL] = longURL                   //uses urlDatabase
  res.redirect("http://localhost:8080/urls/")
});

app.post("/login", (req, res) =>{
  //let userID = req.cookies.userID
  let userID = req.session.userID
  let email = req.body.email
  let password = req.body.password
  let matchFound = false
  for (var person in users){
    if (users[person]['email'] === email && bcrypt.compareSync(password, users[person]['password'])){
      //res.cookie("userID", users[person]['id'])
      req.session.userID = users[person]['id']
      matchFound = true
      }
  };
  if(matchFound === false){
    res.sendStatus(400);
  };
  res.redirect('http://localhost:8080/urls/')
});

app.post("/urls/:id/delete", (req, res) =>{
  var shortURL = req.params.id
  delete urlDatabase[shortURL]
  res.redirect('http://localhost:8080/urls/')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});