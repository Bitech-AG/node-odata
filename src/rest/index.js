"use strict";

import _ from 'lodash';
import { Router } from 'express';
import model from './../model';
import post from './post';
import put from './put';
import del from './delete';
import patch from './patch';
import { get, getAll } from './get';

const getRouter = (_conn, url, params, enableOdataSyntax) => {
  let options = params.options || {};
  let rest = params.rest || {};
  let actions = params.actions || {};

  let resourceURL = `/${url}`;
  let entityURL = `${resourceURL}\\(:id\\)`;

  let routes = [
    {
      method: 'post',
      url: resourceURL,
      controller: post,
      config: rest.post || {},
    },
    {
      method: 'put',
      url: entityURL,
      controller: put,
      config: rest.put || {},
    },
    {
      method: 'patch',
      url: entityURL,
      controller: patch,
      config: rest.patch || {},
    },
    {
      method: 'delete',
      url: entityURL,
      controller: del,
      config: rest.delete || rest.del || {},
    },
    {
      method: 'get',
      url: entityURL,
      controller: get,
      config: rest.get || {},
    },
    {
      method: 'get',
      url: resourceURL,
      controller: getAll,
      config: rest.getAll || {},
    },
  ];

  let mongooseModel = model.get(_conn, url);

  /*jshint -W064 */
  let router = Router();
  routes.map((route) => {
    router[route.method](route.url, (req, res, next) => {
      if (checkAuth(route.config.auth, req)) {
        //TODO: should run controller func after before done. [use app.post(url, auth, before, fn, after)]
        if (route.config.before) {
          if (route.method === 'post') {
            route.config.before(req.body);
          } else {
            mongooseModel.findOne({ _id: req.params.id }, (err, entity) => {
              if (err) {
                return;
              }
              route.config.before(entity);
            });
          }
        }
        route.controller(req, mongooseModel, options).then((result = {}) => {
          res.status(result.status || 200);
          if (result.text) {
            res.send(result.text);
          }
          else if (result.entity) {
            res.jsonp(result.entity);
          }
          else {
            res.end();
          }
          if (route.config.after) {
            route.config.after(result.entity, result.originEntity);
          }
        }, (err) => {
          if (err.status) {
            res.status(err.status).send(err.text || '');
          }
          else {
            next(err);
          }
        });
      }
      else {
        res.status(401).end();
      }
    });
  });

  for(let actionUrl in actions) {
    let action = actions[actionUrl];
    ((actionUrl, action) => {
      let fullUrl = `${entityURL}${actionUrl}`;
      router.post(fullUrl, (req, res, next) => {
        if(checkAuth(action.auth)) {
          action(req, res, next);
        }
        else {
          res.status(401).end();
        }
      });
    })(actionUrl, action);
  }

  return router;
};

const checkAuth = (auth, req) => {
  if (!auth) {
    return true;
  }
  return auth(req);
};

export default { getRouter };
