import supertest from 'supertest';
import { expect } from 'chai';
import { subClass } from 'gm';
import webserver from '../src/server';

const im = subClass({ imageMagick: true });

const parseImage = function(res, callback) {
  res.setEncoding('binary');
  res.data = '';

  res.on('data', function(chunk) {
    res.data += chunk;
  });

  res.on('end', function() {
    callback(null, new Buffer(res.data, 'binary'));
  });
};

describe('routing', function() {
  var request;

  beforeEach(function() {
    request = supertest(webserver);
  });

  describe('root', function() {
    it('redirects to the one-pager', function(done) {
      request.get('/').expect(302).expect('location', '/avatars/tjmckenzie').end(done);
    });
  });

  describe('v1 avatar request', function() {
    it('responds with an image', function(done) {
      request.get('/avatar/abott').expect('Content-Type', /image/).end(done);
    });

    it('can resize an image', function(done) {
      request.get('/avatar/230/abott').parse(parseImage).end(function(err, res) {
        im(res.body).size(function(_, size) {
          expect(size).to.eql({ height: 230, width: 230 });
          done();
        });
      });
    });
  });

  describe('v2 avatar request', function() {
    it('responds with an image', function(done) {
      request.get('/avatars/abott').expect('Content-Type', /image/).end(done);
    });

    it('can resize an image', function(done) {
      request.get('/avatars/220/abott').parse(parseImage).end(function(err, res) {
        im(res.body).size(function(_, size) {
          expect(size).to.eql({ height: 220, width: 220 });
          done();
        });
      });
    });

    it('can manually compose an image', function(done) {
      request.get('/avatars/face/eyes1/nose4/mouth11/bbb')
      .expect(200)
      .expect('Content-Type', /image/)
      .end(done);
    });

    it('can set a default transparent background', function(done) {
      request.get('/avatars/t/abott')
      .expect(200)
      .expect('Content-Type', /image/)
      .end(done);
    });

    it('can set a size and default transparent background', function(done) {
      request.get('/avatars/t/220/abott')
      .expect(200)
      .expect('Content-Type', /image/)
      .end(done);
    });

    it('can manually set transparent background', function(done) {
      request.get('/avatars/face/eyes1/nose4/mouth11/transparent')
      .expect(200)
      .expect('Content-Type', /image/)
      .end(done);
    });
  });

  describe('v2 avatar list requests', function() {
    it('responds with json', function(done) {
      request.get('/avatars/list').expect('Content-Type', /json/).end(done);
    });

    it('responds with a list of possible face parts', function(done) {
      request.get('/avatars/list').end(function(err, res) {
        const faceParts = res.body.face;
        expect(faceParts).to.have.keys('eyes', 'mouth', 'nose');
        done();
      });
    });
  });
});
