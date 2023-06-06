import { Router } from 'express';
import Resource from '../ODataResource';

export default class Metadata {
  constructor(server) {
    this._server = server;
    this._path = '/';
  }

  get() {
    return this;
  }

  match(methods, url) {
    if (methods === 'get'
      && url.indexOf(this._path) === 0) {
      return this.middleware;
    }
    return undefined;
  }

  middleware = async (req, res, next) => {
    try {
      res.$odata.result = await this.ctrl(req);
      res.$odata.status = 200;
      
      next();

    } catch (err) {
      next(err);
    }
  };

  _router() {
    /*eslint-disable */
    const router = Router();
    /* eslint-enable */
    router.get(this._path, this.middleware);

    return router;
  }

  ctrl(req) {
    const entityTypeNames = Object.keys(this._server.resources);
    const entitySets = entityTypeNames
      .filter((item) => this._server.resources[item] instanceof Resource)
      .map((currentResource) => ({
        name: currentResource,
        kind: 'EntitySet',
        url: currentResource,
      }));

    const document = {
      '@context': `${req.protocol}://${req.get('host')}${this._server.get('prefix')}/$metadata`,
      value: entitySets,
    };

    return new Promise((resolve) => {
      resolve(document);
    });
  }
}