// For issue: https://github.com/TossShinHwa/node-odata/issues/96
// For issue: https://github.com/TossShinHwa/node-odata/issues/25

import 'should';
import request from 'supertest';
import { host, conn, port, odata, assertSuccess } from '../support/setup';
import FakeDb from '../support/fake-db';

describe('metadata.action', () => {
  let httpServer, server, db;

  beforeEach(async function() {
    db = new FakeDb();
    server = odata(db);
  
  });

  afterEach(() => {
    httpServer.close();
  });

  it('should return json metadata for action that bound to instance', async function() {
    const jsonDocument = {
      $Version: '4.0',
      ObjectId: {
        $Kind: "TypeDefinition",
        $UnderlyingType: "Edm.String",
        $MaxLength: 24
      },
      'bound-action': {
        $Kind: 'Action',
        $IsBound: true,
        $Parameter: [{
          $Name: 'book',
          $Type: 'node.odata.book'
        }]
      },
      book: {
        $Kind: "EntityType",
        $Key: ["id"],
        id: {
          $Type: "node.odata.ObjectId",
          $Nullable: false,
        },
        author: {
          $Type: 'Edm.String'
        }
      },
      $EntityContainer: 'node.odata',
      ['node.odata']: {
        $Kind: 'EntityContainer',
        book: {
          $Collection: true,
          $Type: `node.odata.book`,
        }
      },
    };
    server.resource('book', { 
      author: String 
    }).action('bound-action', 
      (req, res, next) => {},
      { binding: 'entity' });
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata?$format=json');
    assertSuccess(res);
    res.body.should.deepEqual(jsonDocument);
  });

  it('should return xml metadata for action that bound to instance', async function() {
    const xmlDocument = 
  ` <edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
      <edmx:DataServices>
        <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="node.odata">
          <TypeDefinition Name="ObjectId" UnderlyingType="Edm.String" MaxLength="24">
          </TypeDefinition>
          <EntityType Name="book">
            <Key>
              <PropertyRef Name="id"/>
            </Key>
            <Property Name="id" Type="node.odata.ObjectId" Nullable="false"/>
            <Property Name="author" Type="Edm.String"/>
          </EntityType>
          <Action Name="bound-action" IsBound="true">
            <Parameter Name="book" Type="node.odata.book"/>
          </Action>
          <EntityContainer Name="Container">
            <EntitySet Name="book" EntityType="node.odata.book"/>
          </EntityContainer>
        </Schema>
      </edmx:DataServices>
    </edmx:Edmx>`.replace(/\s*</g, '<').replace(/>\s*/g, '>');
    server.resource('book', { 
      author: String 
    }).action('bound-action', 
      (req, res, next) => {},
      { binding: 'entity' });
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata').set('accept', 'application/xml');
    assertSuccess(res);
    res.text.should.equal(xmlDocument);
  });

  it('should return json metadata for action that bound to collection', async function() {
    const jsonDocument = {
      $Version: '4.0',
      ObjectId: {
        $Kind: "TypeDefinition",
        $UnderlyingType: "Edm.String",
        $MaxLength: 24
      },
      'bound-action': {
        $Kind: 'Action',
        $IsBound: true,
        $Parameter: [{
          $Name: 'book',
          $Type: 'node.odata.book',
          $Collection: true
        }]
      },
      book: {
        $Kind: "EntityType",
        $Key: ["id"],
        id: {
          $Type: "node.odata.ObjectId",
          $Nullable: false,
        },
        author: {
          $Type: 'Edm.String'
        }
      },
      $EntityContainer: 'node.odata',
      ['node.odata']: {
        $Kind: 'EntityContainer',
        book: {
          $Collection: true,
          $Type: `node.odata.book`,
        }
      },
    };
    server.resource('book', { 
      author: String 
    }).action('bound-action', 
      (req, res, next) => {},
      { binding: 'collection' });
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata?$format=json');
    assertSuccess(res);
    res.body.should.deepEqual(jsonDocument);
  });

  it('should return xml metadata for action that bound to collection', async function() {
    const xmlDocument = 
  ` <edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
      <edmx:DataServices>
        <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="node.odata">
          <TypeDefinition Name="ObjectId" UnderlyingType="Edm.String" MaxLength="24">
          </TypeDefinition>
          <EntityType Name="book">
            <Key>
              <PropertyRef Name="id"/>
            </Key>
            <Property Name="id" Type="node.odata.ObjectId" Nullable="false"/>
            <Property Name="author" Type="Edm.String"/>
          </EntityType>
          <Action Name="bound-action" IsBound="true">
            <Parameter Name="book" Type="Collection(node.odata.book)"/>
          </Action>
          <EntityContainer Name="Container">
            <EntitySet Name="book" EntityType="node.odata.book"/>
          </EntityContainer>
        </Schema>
      </edmx:DataServices>
    </edmx:Edmx>`.replace(/\s*</g, '<').replace(/>\s*/g, '>');
    server.resource('book', { 
      author: String 
    }).action('bound-action', 
      (req, res, next) => {},
      { binding: 'collection' });
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata').set('accept', 'application/xml');
    assertSuccess(res);
    res.text.should.equal(xmlDocument);
  });

  it('should not accept action names with special characters', function() {
    try {
      const resource = server.resource('book', { 
        author: String 
      }).action('/login', (req, res, next) => {});

      resource.actions['/login'].getRouter();

      throw new Error('Invalid name should not accepted');
      
    } catch(error) {
      error.message.should.equal(`Invalid action name '/login'`);
    }
  });


  it('should return json metadata for unbound action', async function() {
    const jsonDocument = {
      $Version: '4.0',
      ObjectId: {
        $Kind: "TypeDefinition",
        $UnderlyingType: "Edm.String",
        $MaxLength: 24
      },
      'unbound-action': {
        $Kind: 'Action',
        $Parameter: [{
          $Name: 'book',
          $Type: 'node.odata.book'
        }]
      },
      book: {
        $Kind: "EntityType",
        $Key: ["id"],
        id: {
          $Type: "node.odata.ObjectId",
          $Nullable: false,
        },
        author: {
          $Type: 'Edm.String'
        }
      },
      $EntityContainer: 'node.odata',
      ['node.odata']: {
        $Kind: 'EntityContainer',
        book: {
          $Collection: true,
          $Type: `node.odata.book`,
        },
        'unbound-action-import': {
          $Action: 'node.odata.unbound-action'
        }
      }
    };
    server.resource('book', { 
      author: String 
    });
    server.action('unbound-action', 
      (req, res, next) => {}, { 
        $Parameter: [{
          $Name: 'book',
          $Type: 'book'
        }]
      });
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata?$format=json');
    assertSuccess(res);
    res.body.should.deepEqual(jsonDocument);
  });

  it('should return xml metadata for action without parameter', async function() {
    const xmlDocument = 
  ` <edmx:Edmx xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx" Version="4.0">
      <edmx:DataServices>
        <Schema xmlns="http://docs.oasis-open.org/odata/ns/edm" Namespace="node.odata">
          <TypeDefinition Name="ObjectId" UnderlyingType="Edm.String" MaxLength="24">
          </TypeDefinition>
          <EntityType Name="book">
            <Key>
              <PropertyRef Name="id"/>
            </Key>
            <Property Name="id" Type="node.odata.ObjectId" Nullable="false"/>
            <Property Name="author" Type="Edm.String"/>
          </EntityType>
          <Action Name="unbound-action">
          </Action>
          <EntityContainer Name="Container">
            <EntitySet Name="book" EntityType="node.odata.book"/>
            <ActionImport Name="unbound-action-import" Action="node.odata.unbound-action"/>
          </EntityContainer>
        </Schema>
      </edmx:DataServices>
    </edmx:Edmx>`.replace(/\s*</g, '<').replace(/>\s*/g, '>');
    server.resource('book', { 
      author: String 
    });
    server.action('unbound-action', 
      (req, res, next) => {});
    httpServer = server.listen(port);
    const res = await request(host).get('/$metadata').set('accept', 'application/xml');
    assertSuccess(res);
    res.text.should.equal(xmlDocument);
  });
});
