import 'should';
import request from 'supertest';
import sinon from 'sinon';
import { odata, host, port, assertSuccess } from '../../../support/setup';
import mongoose from 'mongoose';
import { init } from '../../../support/db';

const Schema = mongoose.Schema;
const ModelSchema = new Schema({
  client: Number
});

const Model = mongoose.model('client', ModelSchema);

describe('mongo.mocked.odata.client', () => {
  const query = {
    $where: () => { },
    where: () => { },
    equals: () => { },
    gte: () => { },
    lt: () => { },
    exec: () => { },
    count: () => new Promise((resolve) => resolve(1)),
    model: Model
  };
  let httpServer, server, modelMock, instanceMock, queryMock;

  beforeEach(async function () {
    server = odata();
    init(server);

  });

  afterEach(() => {
    if (httpServer) {
      httpServer.close();
    }
    modelMock?.restore();
    instanceMock?.restore();
    queryMock?.restore();
  });

  it('should fail on delete with wrong client', async function () {
    const entity = server.mongoEntity('client', Model);

    entity.clientField = 'client';

    modelMock = sinon.mock(Model);
    modelMock.expects('findById').once()
      .withArgs('1')
      .returns(new Promise(resolve => resolve({
        toObject: () => ({
          _id: 1,
          client: 98
        })
      })));
    httpServer = server.listen(port);

    const res = await request(host).delete(`/client('1')?sap-client=099`);

    res.status.should.be.equal(404);

    modelMock.verify();
  });

  it('should work on delete with client', async function () {
    const entity = server.mongoEntity('client', Model);

    entity.clientField = 'client';

    const instance = {
      client: 99,
      deleteOne: async () => {}
    };
    modelMock = sinon.mock(Model);
    modelMock.expects('findById').once()
      .withArgs('1')
      .returns(new Promise(resolve => resolve(instance)));

    instanceMock = sinon.mock(instance);
    instanceMock.expects('deleteOne').once();
    httpServer = server.listen(port);

    const res = await request(host).delete(`/client('1')?sap-client=099`);

    res.status.should.be.equal(204);

    modelMock.verify();
    instanceMock.verify();
  });

});
