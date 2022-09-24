// For issue: https://github.com/TossShinHwa/node-odata/issues/96
// For issue: https://github.com/TossShinHwa/node-odata/issues/25

import 'should';
import request from 'supertest';
import { host, conn, port, bookSchema, odata, assertSuccess } from './support/setup';
import FakeDb from './support/fake-db';

describe('metadata', () => {
  let data, httpServer, server, db;
  const jsonDocument = {
    $Version: '4.0',
    ObjectId: {
      $Kind: "TypeDefinition",
      $UnderlyingType: "Edm.String",
      $MaxLength: 24
    },
    book: {
      $Kind: "EntityType",
      $Key: ["id"],
      id: {
        $Type: "self.ObjectId",
        $Nullable: false,
      },
      author: {
        $Type: 'Edm.String'
      },
      description: {
        $Type: 'Edm.String'
      },
      genre: {
        $Type: 'Edm.String'
      },
      price: {
        $Type: 'Edm.Double'
      },
      publish_date: {
        $Type: 'Edm.DateTimeOffset'
      },
      title: {
        $Type: 'Edm.String'
      }
    },
    $EntityContainer: 'org.example.DemoService',
    ['org.example.DemoService']: {
      $Kind: 'EntityContainer',
      book: {
        $Collection: true,
        $Type: `self.book`,
      }
    },
  };

  beforeEach(async function() {
    //db = new FakeDb();
    server = odata(conn);
    server.resource('book', bookSchema);

  });

  afterEach(() => {
    httpServer.close();
  });

  it('should return xml if no format given', async function() {
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata');
    assertSuccess(res);
    checkContentType(res, 'application/xml');
  });

  it('should return json according accept header', async function() {
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata').set('accept', 'application/json');
    assertSuccess(res);
    checkContentType(res, 'application/json');
    res.body.should.deepEqual(jsonDocument);
  });

  it('should return xml if $format overrides accept header', async function() {
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata?$format=json').set('accept', 'application/xml');
    res.statusCode.should.equal(200);
    checkContentType(res, 'application/json');
    res.body.should.deepEqual(jsonDocument);
  });
});


function checkContentType(res, value) {
  res.header.should.have.property('content-type');
  res.header['content-type'].should.containEql(value);
}