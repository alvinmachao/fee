"use strict";

function _typeof(obj) {
  "@babel/helpers - typeof";
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj &&
        typeof Symbol === "function" &&
        obj.constructor === Symbol &&
        obj !== Symbol.prototype
        ? "symbol"
        : typeof obj;
    };
  }
  return _typeof(obj);
}

Object.defineProperty(exports, "__esModule", {
  value: true,
});
exports.default = void 0;

var _try = _interopRequireWildcard(require("./try"));

var _util = require("./util");

function _getRequireWildcardCache() {
  if (typeof WeakMap !== "function") return null;
  var cache = new WeakMap();
  _getRequireWildcardCache = function _getRequireWildcardCache() {
    return cache;
  };
  return cache;
}

function _interopRequireWildcard(obj) {
  if (obj && obj.__esModule) {
    return obj;
  }
  if (
    obj === null ||
    (_typeof(obj) !== "object" && typeof obj !== "function")
  ) {
    return { default: obj };
  }
  var cache = _getRequireWildcardCache();
  if (cache && cache.has(obj)) {
    return cache.get(obj);
  }
  var newObj = {};
  var hasPropertyDescriptor =
    Object.defineProperty && Object.getOwnPropertyDescriptor;
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      var desc = hasPropertyDescriptor
        ? Object.getOwnPropertyDescriptor(obj, key)
        : null;
      if (desc && (desc.get || desc.set)) {
        Object.defineProperty(newObj, key, desc);
      } else {
        newObj[key] = obj[key];
      }
    }
  }
  newObj.default = obj;
  if (cache) {
    cache.set(obj, newObj);
  }
  return newObj;
}

var monitor = {};
monitor.tryJS = _try.default;
(0, _try.setting)({
  handleTryCatchError: handleTryCatchError,
});

monitor.init = function (opts) {
  __config(opts);

  __init();
}; // 忽略错误监听

window.ignoreError = false; // 错误日志列表

var errorList = []; // 错误处理回调

var report = function report() {};

var config = {
  concat: true,
  delay: 2000,
  // 错误处理间隔时间
  maxError: 16,
  // 异常报错数量限制
  sampling: 1, // 采样率
}; // 定义的错误类型码

var ERROR_RUNTIME = 1;
var ERROR_SCRIPT = 2;
var ERROR_STYLE = 3;
var ERROR_IMAGE = 4;
var ERROR_AUDIO = 5;
var ERROR_VIDEO = 6;
var ERROR_CONSOLE = 7;
var ERROR_TRY_CATHC = 8;
var LOAD_ERROR_TYPE = {
  SCRIPT: ERROR_SCRIPT,
  LINK: ERROR_STYLE,
  IMG: ERROR_IMAGE,
  AUDIO: ERROR_AUDIO,
  VIDEO: ERROR_VIDEO,
};

function __config(opts) {
  (0, _util.merge)(opts, config);
  report = (0, _util.debounce)(config.report, config.delay, function () {
    errorList = [];
  });
}

function __init() {
  // 监听 JavaScript 报错异常(JavaScript runtime error)
  // window.onerror = function () {
  //   if (window.ignoreError) {
  //     window.ignoreError = false
  //     return
  //   }
  //   handleError(formatRuntimerError.apply(null, arguments))
  // }
  // 监听资源加载错误(JavaScript Scource failed to load)
  window.addEventListener(
    "error",
    function (event) {
      // 过滤 target 为 window 的异常，避免与上面的 onerror 重复
      var errorTarget = event.target;

      if (
        errorTarget !== window &&
        errorTarget.nodeName &&
        LOAD_ERROR_TYPE[errorTarget.nodeName.toUpperCase()]
      ) {
        handleError(formatLoadError(errorTarget));
      } else {
        // onerror会被覆盖, 因此转为使用Listener进行监控
        var message = event.message,
          filename = event.filename,
          lineno = event.lineno,
          colno = event.colno,
          error = event.error;
        handleError(
          formatRuntimerError(message, filename, lineno, colno, error)
        );
      }
    },
    true
  );
  //监听开发中浏览器中捕获到未处理的Promise错误
  window.addEventListener(
    "unhandledrejection",
    function (event) {
      console.log(
        "Unhandled Rejection at:",
        event.promise,
        "reason:",
        event.reason
      );
      handleError(event);
    },
    true
  ); // 针对 vue 报错重写 console.error
  // TODO

  console.error = (function (origin) {
    return function (info) {
      var errorLog = {
        type: ERROR_CONSOLE,
        desc: info,
      };
      handleError(errorLog);
      origin.call(console, info);
    };
  })(console.error);
} // 处理 try..catch 错误

function handleTryCatchError(error) {
  handleError(formatTryCatchError(error));
}
/**
 * 生成 runtime 错误日志
 *
 * @param  {String} message 错误信息
 * @param  {String} source  发生错误的脚本 URL
 * @param  {Number} lineno  发生错误的行号
 * @param  {Number} colno   发生错误的列号
 * @param  {Object} error   error 对象
 * @return {Object}
 */

function formatRuntimerError(message, source, lineno, colno, error) {
  return {
    type: ERROR_RUNTIME,
    desc: message + " at " + source + ":" + lineno + ":" + colno,
    stack: error && error.stack ? error.stack : "no stack", // IE <9, has no error stack
  };
}
/**
 * 生成 laod 错误日志
 *
 * @param  {Object} errorTarget
 * @return {Object}
 */

function formatLoadError(errorTarget) {
  return {
    type: LOAD_ERROR_TYPE[errorTarget.nodeName.toUpperCase()],
    desc: errorTarget.baseURI + "@" + (errorTarget.src || errorTarget.href),
    stack: "no stack",
  };
}
/**
 * 生成 try..catch 错误日志
 *
 * @param  {Object} error error 对象
 * @return {Object} 格式化后的对象
 */

function formatTryCatchError(error) {
  return {
    type: ERROR_TRY_CATHC,
    desc: error.message,
    stack: error.stack,
  };
}
/**
 * 错误数据预处理
 *
 * @param  {Object} errorLog    错误日志
 */

function handleError(errorLog) {
  // 是否延时处理
  if (!config.concat) {
    !needReport(config.sampling) || config.report([errorLog]);
  } else {
    pushError(errorLog);
    report(errorList);
  }
}
/**
 * 往异常信息数组里面添加一条记录
 *
 * @param  {Object} errorLog 错误日志
 */

function pushError(errorLog) {
  if (needReport(config.sampling) && errorList.length < config.maxError) {
    errorList.push(errorLog);
  }
}
/**
 * 设置一个采样率，决定是否上报
 *
 * @param  {Number} sampling 0 - 1
 * @return {Boolean}
 */

function needReport(sampling) {
  return Math.random() < (sampling || 1);
}

var _default = monitor;
exports.default = _default;
