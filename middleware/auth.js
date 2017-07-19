'use strict';

// auth中间件

const AdminUser = require('../database/models')['AdminUser'];
const apiPath = process.env.API_PATH + '/' + process.env.API_VERSION;
const sessionPath = apiPath + '/admin/sessions';

// 要求用户登录
function login(req, res, next) {
  // 查询或创建session时无需检测登录
  const reqPath = req.baseUrl + req.path;
  if ((req.method === 'GET' || req.method === 'POST') && reqPath === sessionPath) {
    return next();
  }

  if (req.session.user && req.session.user.id) {
    req.user = req.session.user; // 将用户信息添加到request对象
    next();
  } else {
    next({message: 'Please login first', status: 401});
  }
}

// 要求用户具有某种角色
function buildRoleAuth(roleName) {
  if (!roleName) {
    throw 'Invalid role name for role auth middleware!';
  }

  const role = function (req, res, next) {
    if (!AdminUser) {
      console.error('AdminUser model is invalid!');
      return next({message: 'Models initialization error', status: 500});
    }

    const userId = req.session.user.id;
    AdminUser.findById(userId).then(user => {
      if (user) {
        user.hasRole(roleName).then(result => {
          if (result) {
            next();
          } else {
            next({message: 'Permission denied', status: 403});
          }
        });
      } else {
        next({message: 'User not found', status: 400});
      }
    });
  };

  return [login, role];
}

module.exports = {
  login: login,
  role: buildRoleAuth
};