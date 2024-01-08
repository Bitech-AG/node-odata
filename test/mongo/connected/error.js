import 'should';
import request from 'supertest';
import { host, port, odata } from '../../support/setup';
import mongoose from 'mongoose';
import { connect } from '../../support/db';

const Schema = mongoose.Schema;

describe('mongo.error', () => {
  let httpServer, server;

  before(() => {
    mongoose.set('overwriteModels', true);
  });

  beforeEach(async function() {
    server = odata();
  
  });

  afterEach(() => {
    httpServer.close();
    mongoose.default.connection.close();
  });

  it('should return 400 for mongo validation errors', async function() {
    const result = {
      error: {
        code: '400',
        message: 'Path `password` (`ggm`) is shorter than the minimum allowed length (8).',
        target: 'password'
      }
    };
    const UserSchema = new Schema({
      email: {
        type: String
      },
      password: {
        type: String,
        minLength: 8
      },
    });
    
    const UserModel = mongoose.model('User', UserSchema);

    server.mongoEntity('User', UserModel);
    await connect(server);
    httpServer = server.listen(port);

    const res = await request(host)
      .post('/User')
      .send({ password: 'ggm' });    

    res.body.should.deepEqual(result);
  });


  it('should return 400 if all required fields are not specified', async function() {
    const result = {
      error: {
        code: '400',
        message: 'Last name is obligatory',
        target: '$Parameter/name/last'
      }
    };
    const UserSchema = new Schema({
      name: {
        first: {
          type: String,
          required: [
            () => true,
            'First name is obligatory'
          ]
        },
        last: {
          type: String,
          required: [
            () => true,
            'Last name is obligatory'
          ]
        }
      }
    });
    
    mongoose.model('User', UserSchema);

    server.complexType('fullName', {
      first: {
        $Type: 'Edm.String'
      },
      last: {
        $Type: 'Edm.String'
      }
    });
    server.action('register', async (req, res, next) => {
      try {
        const { name } = req.body;
    
        const user = new req.$odata.mongo.models.User({
          name
        });
    
        const savedUser = await user.save({
          validateBeforeSave: true,
          validateModifiedOnly: true
        });
    
        res.$odata.result = savedUser.toObject();
        res.$odata.status = 201;
    
      } catch (error) {
        next(error);
      }
    }, {
      $Parameter: [{
        $Type: 'node.odata.fullName',
        $Name: 'name'
      }]
    });
    await connect(server);
    httpServer = server.listen(port);

    const res = await request(host)
      .post('/node.odata.register')
      .send({ name: { first: 'ggm' } });    

    res.body.should.deepEqual(result);
  });

});
