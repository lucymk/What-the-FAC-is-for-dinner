const fs = require('fs');
const path = require('path');
const querystring = require('querystring');
const getDishes = require('./queries/getDishes.js');
const addDishes = require('./queries/addDishes');
const checkUser = require('./queries/checkUser');
const logInQuery = require('./queries/logIn');
const bcrypt = require('bcryptjs');
const cookie = require('cookie');
const jwt = require('jsonwebtoken');
require('env2')('config.env');
const secret = process.env.SECRET;

const homeHandler = (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'index.html');
  fs.readFile(filePath, (err, file) => {
    if (err) {
      console.log(err);
      res.writeHead(500, { 'Content-type': 'text/plain' });
      res.end('file not found');
    }
    res.writeHead(200, { 'Content-type': 'text/html' });
    res.end(file);
  });
};

const staticFileHandler = (req, res) => {

  const extensionType = {
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    ico: 'image/x-icon',
    jpg: 'image/jpeg',
  };

  const extension = req.url.split('.')[1];

  const filePath = path.join(__dirname, '..', req.url);

  fs.readFile(filePath, (err, file) => {
    if (err) {
      console.log(err);
      res.writeHead(404, { 'Content-type': 'text/plain' });
      res.end('Page not found');
    }
    res.writeHead(200, `Content-type: ${extensionType[extension]}`);
    res.end(file);
  });
};

const getDishesHandler = (req, res) => {
  getDishes((err, resData) => {
    if (err) {
      res.writeHead(500, { 'Content-type': 'text/plain' });
      res.end('Something went wrong on the server');
    } else {
      const jsonData = JSON.stringify(resData);
      res.writeHead(200, { 'Content-type': 'application/json' });
      res.end(jsonData);
    }
  });
};

const addDishesHandler = (req, res) => {
  let allTheData = '';
  req.on('data', (chunk) => {
    allTheData += chunk;
  });
  req.on('end', () => {
    allTheData = querystring.parse(allTheData);

    const newObject = {
      name: allTheData.name,
      gitterhandle: allTheData.gitterhandle,
      dish: allTheData.dish,
      dietary: Object.keys(allTheData).slice(3),
    };
    if (newObject.dietary.length === 0) newObject.dietary = ['none of the above'];
    addDishes((err, resData) => {
      if (err) {
        console.log(err.code, "THIS IS ERR CODE");
        if (err.code === '23505') {
          res.writeHead(400, { 'Content-type': 'text/plain' });
          res.end('You have already added a dish');
        } else {
          console.log(err);
          res.writeHead(500, { 'Content-type': 'text/plain' });
          res.end('Something went wrong on the server');
        }
      } else {
        res.writeHead(302, { 'Location' : '/' });
        res.end();
      }
    }, newObject.name, newObject.gitterhandle, newObject.dish, newObject.dietary);
  });
};

const hashPassword = (password, callback) => {
  bcrypt.genSalt(10, (saltErr, salt) => {
    if (saltErr) console.log(saltErr);
    else bcrypt.hash(password, salt, callback);
  });
};

const signUpHandler = (req, res) => {
  let allTheData = '';
  req.on('data', (chunk) => {
    allTheData += chunk;
  });
  req.on('end', () => {
    allTheData = queryString.parse(allTheData);
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(allTheData.password, salt, (err, hashedPw) => {
        if(err) {
          res.writeHead(500);
          res.end('Internal Server Error');
        } else {
          allTheData.password = hashedPw;


        }
      })
    })
  })

};




const logInHandler = (req, res) => {
  let allTheData = '';

  req.on('data', (chunk) => {
    allTheData += chunk;
  });

  req.on('end', () => {
    allTheData = querystring.parse(allTheData);
    checkUser(allTheData.gitterhandle, (err, resData) => {
      const userExists = resData.rows[0].case;
      if (err) {
        res.writeHead(500);
        res.end('Internal Server Error');
      } else if (userExists) {
        logInQuery(allTheData.gitterhandle, (loginErr, loginData) => {
          if (loginErr) {
            res.writeHead(500);
            res.end('Internal Server Error - login query failed');
          } else {
            const databasePassword = loginData.rows[0].password;
            bcrypt.compare(allTheData.password, databasePassword, (compareErr, correct) => {
              if (compareErr) {
                res.writeHead(500);
                res.end('Server error, bcrypt compare failed');
              } else if (correct) {
                console.log('Successful login!');
                jwt.sign({ name: allTheData.gitterhandle}, secret, (err, token) => {
                  if (err) {
                    res.writeHead(500);
                    res.end('Server Error, jwt signing failed');
                  }
                  else {
                    res.writeHead(302, { 'Location': '/', 'Set-Cookie': `token=${token}; HttpOnly; Max-Age=100` });
                    res.end();
                  }
                });
              } else {
                res.writeHead(401);
                res.end('Incorrect Password!');
              }
            });
          }
        });
      } else {
        res.writeHead(401);
        res.end('You are not a user, please sign-up!');
      }
    });
  });
};

module.exports = {
  homeHandler,
  staticFileHandler,
  getDishesHandler,
  addDishesHandler,
  logInHandler,
  signUpHandler,
};
