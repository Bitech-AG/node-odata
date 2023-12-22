import 'should';
import request from 'supertest';
import { odata, host, port, assertSuccess } from './support/setup';

describe('odata.functions', () => {
  ['get', 'post', 'put', 'delete'].map((method) => {
    describe(method, function() {
      let httpServer;

      before(() => {
        const server = odata();
        server.function('test',
          (req, res, next) => {
            res.$odata.result = { test: 'ok' };
            res.$odata.status = 200;
            next();
          },
          { method });
        httpServer = server.listen(port);
      });

      after(() => {
        httpServer.close();
      });

      it('should work', async function() {
        const res = await request(host)[method]('/test');
        assertSuccess(res);
        res.body.test.should.be.equal('ok');
      });
    });
  });
});
