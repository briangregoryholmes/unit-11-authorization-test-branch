const app = require('./../server/server');
const request = require('supertest')(app);
const expect = require('chai').expect;
const Session = require('./../server/models/sessionModel');
const User = require('./../server/models/userModel');
const bcrypt = require('bcryptjs');
const sinon = require('sinon');

describe('Unit 10 Tests', () => {
  let id;
  let clock;

  before(() => {
    clock = sinon.useFakeTimers();
  });

  beforeEach((done) => {
    User.remove({}, () => {
      Session.remove({}, () => {
        User.create(
          {
            username: 'david',
            password: 'aight',
          },
          (err, user) => {
            id = user.id;
            done();
          }
        );
      });
    });
  });

  after(() => {
    clock.restore();
  });

  describe('Creating users', () => {
    it('POST request to "/signup" route with correctly formatted body creates a user', (done) => {
      request
        .post('/signup')
        .send({ username: 'test1', password: 'password1' })
        .type('form')
        .end((err, res) => {
          User.findOne({ username: 'test1' }, (err, user) => {
            expect(err).to.be.null;
            expect(user).to.exist;
            done();
          });
        });
    });

    it('POST request to "/signup" route with incorrectly formatted body should redirect to "/signup" with an error message', (done) => {
      request
        .post('/signup')
        .send({ username: 'test2' })
        .type('form')
        .end((err, res) => {
          console.log(res.text);
          expect(res.text.match(/Error/)).to.not.be.null;
          done();
        });
    });

    it('POST request to "/signup" route with incorrectly formatted body does not create a new User', (done) => {
      request
        .post('/signup')
        .send({ username: 'test2' })
        .type('form')
        .end((err, res) => {
          User.findOne({ username: 'test2' }, (err, user) => {
            expect(user).to.not.exist;
            done();
          });
        });
    });
  });

  describe('Authenticating users', () => {
    it('POST request to "/login" route with correctly formated correct information redirects to "/secret"', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'aight' })
        .end((err, res) => {
          expect(res.headers.location).to.eql('/secret');
          done();
        });
    });

    it('POST request to "/login" route with incorrect password redirects to "/signup"', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'incorrect' })
        .end((err, res) => {
          expect(res.headers.location).to.eql('/signup');
          done();
        });
    });

    it('POST request to "/login" route with non-existent user redirects to "/signup"', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'idontexist', password: 'aight' })
        .end((err, res) => {
          expect(res.headers.location).to.eql('/signup');
          done();
        });
    });
  });

  describe('Cookies', () => {
    it('Header has cookie name of "codesmith"', (done) => {
      request.get('/').expect('set-cookie', /codesmith=/, done);
    });

    it('"codesmith" cookie has value of "hi"', (done) => {
      request.get('/').expect('set-cookie', /hi/, done);
    });

    it('Header has a cookie name "secret"', (done) => {
      request.get('/').expect('set-cookie', /secret=/, done);
    });

    it('"secret" cookie has a random value from 0-99', (done) => {
      let oldNumber;
      let newNumber;
      let cookies;
      request.get('/').end((err, res) => {
        oldNumber = getCookie(res.headers['set-cookie'], 'secret');
        request.get('/').end((err, res) => {
          newNumber = getCookie(res.headers['set-cookie'], 'secret');
          expect(newNumber).to.be.within(0, 99);
          expect(oldNumber).to.be.within(0, 99);
          expect(newNumber).to.not.eql(oldNumber);
          done();
        });
      });
    });

    it('Header has a cookie named "ssid" when a user successfully logins', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'aight' })
        .expect('set-cookie', /ssid=/, done);
    });

    it('"ssid" cookie is HttpOnly', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'aight' })
        .expect('set-cookie', /HttpOnly/, done);
    });

    it('Header has a cookie named "ssid" when a user successfully signs up', (done) => {
      request
        .post('/signup')
        .type('form')
        .send({ username: 'newuser', password: 'cool' })
        .expect('set-cookie', /ssid=/, done);
    });

    it('"ssid" cookie has value equal to the id of the user', (done) => {
      const regex = new RegExp(id);
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'aight' })
        .expect('set-cookie', regex, done);
    });
  });

  describe('Sessions', () => {
    it('Creates a session when a user successfully creates an account', (done) => {
      request
        .post('/signup')
        .type('form')
        .send({ username: 'test2', password: 'password2' })
        .end((err, res) => {
          User.findOne({ username: 'test2' }, (err, user) => {
            Session.findOne({ cookieId: user._id }, (err, session) => {
              expect(err).to.be.null;
              expect(session).to.exist;
              done();
            });
          });
        });
    });

    it('Creates a session when a user successfully logins to an account', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'aight' })
        .end((err, res) => {
          User.findOne({ username: 'david' }, (err, user) => {
            Session.findOne({ cookieId: user._id }, (err, session) => {
              expect(err).to.be.null;
              expect(session).to.exist;
              done();
            });
          });
        });
    });

    it('Does not create a session if login unsuccessful', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'wrong password' })
        .end((err, res) => {
          User.findOne({ username: 'david' }, (err, user) => {
            Session.findOne({ cookieId: user._id }, (err, session) => {
              expect(err).to.be.null;
              expect(session).to.not.exist;
              done();
            });
          });
        });
    });
  });

  describe('Authorizing users', () => {
    it('Block "/secret" if session not active', (done) => {
      request.get('/secret').end((err, res) => {
        expect(res.text).to.not.include('Secret');
        expect(res.text).to.not.include('david');
        done();
      });
    });

    it('Redirects from "/secret" to "/signup" if session not active', (done) => {
      request
        .get('/secret')
        .expect(302)
        .end((err, res) => {
          expect(res.headers.location).to.eql('/signup');
          done();
        });
    });

    it('Allows access to "/secret" if session active', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'aight' })
        .end((err, res) => {
          const cookie = res.headers['set-cookie'][0].split(';')[0];

          request
            .get('/secret') //Change this line to .get('/secret/users')
            .set('Cookie', cookie)
            .expect(200)
            .end((err, res) => {
              expect(res.text).to.contain('Secret'); //Comment out this line
              expect(res.text).to.contain('david');
              done(err);
            });
        });
    });

    it('Should not be able to access "/secret" after session expires', (done) => {
      request
        .post('/login')
        .type('form')
        .send({ username: 'david', password: 'aight' })
        .end((err, res) => {
          Session.remove({ cookieId: id }, (err, session) => {
            request
              .get('/secret')
              .expect(302)
              .end((err, res) => {
                expect(res.headers.location).to.eql('/signup');
                done();
              });
          });
        });
    });
  });

  describe('Bcrypting passwords', () => {
    it('Passwords should not be stored in plaintext', (done) => {
      request
        .post('/signup')
        .send({ username: 'test3', password: 'password3' })
        .type('form')
        .end((err, res) => {
          User.findOne({ username: 'test3' }, (err, user) => {
            expect(user.password).to.not.eql('password3');
            done();
          });
        });
    });

    it('Passwords be bcrypted', (done) => {
      request
        .post('/signup')
        .send({ username: 'test4', password: 'password4' })
        .type('form')
        .end((err, res) => {
          User.findOne({ username: 'test4' }, (err, user) => {
            expect(bcrypt.compareSync('password4', user.password)).to.be.true;
            done();
          });
        });
    });

    it('Bcrypts passwords in Mongoose middleware, not in userController', (done) => {
      User.create({ username: 'petri', password: 'aight' }, (err, user) => {
        expect(user.password).to.not.eql('aight');
        expect(bcrypt.compareSync('aight', user.password)).to.be.true;
        done();
      });
    });
  });
});

function getCookieValue(cookie) {
  return cookie[0].split(';')[0].split('=')[1];
}

function getCookie(cookieArray, name) {
  return getCookieValue(
    cookieArray.filter((el) => {
      return el.split(';')[0].split('=')[0] === name;
    })
  );
}
