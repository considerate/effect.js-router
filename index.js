'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.inputs = exports.Actions = undefined;

var _zenObservable = require('zen-observable');

var _zenObservable2 = _interopRequireDefault(_zenObservable);

var _effectjs = require('effectjs');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var Actions = exports.Actions = (0, _effectjs.Types)('gotoPage', 'urlChanged', 'pageAction', 'hashUpdated');

var init = function init(router) {
    return function (startpage) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
            args[_key - 1] = arguments[_key];
        }

        var pages = router.pages;

        var page = pages[startpage].component;
        var result = page.init.apply(page, args);
        return result.then(function (pageState, pageEffect) {
            return (0, _effectjs.Result)({
                page: page,
                pageState: pageState,
                pages: pages
            }, pageEffect.map(_effectjs.Action.wrap(Actions.pageAction, { page: page })));
        });
    };
};

var updateHash = function updateHash(hash) {
    return _effectjs.Effect.call(function (hash) {
        history.pushState(null, null, '#' + hash);
        return (0, _effectjs.Action)(Actions.hashUpdated);
    }, hash);
};

var update = function update(router) {
    return function (state, action) {
        var type = action.type;
        var data = action.data;

        if (type === Actions.gotoPage) {
            var _ret = (function () {
                var pagename = data.page;
                var _data$args = data.args;
                var args = _data$args === undefined ? [] : _data$args;
                var pages = state.pages;

                var page = pages[pagename].component;
                return {
                    v: page.init.apply(page, _toConsumableArray(args)).then(function (pageState, pageEffect) {
                        return (0, _effectjs.Result)({
                            page: page,
                            pageState: pageState,
                            pages: pages
                        }, _effectjs.Effect.all([pageEffect.map(_effectjs.Action.wrap(Actions.pageAction, { page: page })), updateHash(pagename)]));
                    })
                };
            })();

            if ((typeof _ret === 'undefined' ? 'undefined' : _typeof(_ret)) === "object") return _ret.v;
        } else if (type === Actions.urlChanged) {} else if (type === Actions.pageAction) {
            var _ret2 = (function () {
                var pageState = state.pageState;
                var page = state.page;
                var pages = state.pages;
                var actionPage = data.page;

                if (page !== actionPage) {
                    return {
                        v: (0, _effectjs.Result)(state)
                    }; //Do not handle actions for pages not shown
                }
                var pageAction = _effectjs.Action.unwrap(action);
                return {
                    v: page.update(pageState, pageAction).then(function (nextPageState, nextPageEffect) {
                        return (0, _effectjs.Result)({
                            page: page,
                            pageState: nextPageState,
                            pages: pages
                        }, nextPageEffect.map(_effectjs.Action.wrap(Actions.pageAction, { page: page })));
                    })
                };
            })();

            if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
        } else if (type === Actions.hashUpdated) {
            return (0, _effectjs.Result)(state);
        }
    };
};

var view = function view(router) {
    return function (state, next) {
        return state.page.view(state.pageState, _effectjs.Action.to(next, Actions.pageAction, { page: state.page }));
    };
};

var Router = function Router(pages, elsePage) {
    return {
        pages: pages,
        elsePage: elsePage,
        when: function when(url, config) {
            var pages = this.pages;
            var elsePage = this.elsePage;

            if (elsePage) {
                throw new Error('Cannot chain whens after else');
            }
            pages[url] = config;
            return Router(pages, elsePage);
        },
        else: function _else(config) {
            var pages = this.pages;

            return Router(pages, config);
        },

        get init() {
            return init(this);
        },
        get update() {
            return update(this);
        },
        get view() {
            return view(this);
        }
    };
};

exports.default = function () {
    return Router({}, undefined);
};

var inputs = exports.inputs = new _zenObservable2.default(function (observer) {
    if (window && 'onhashchange' in window) {
        winow.onhashchange = function () {
            observer.next((0, _effectjs.Action)(Actions.urlChanged, window.location.hash.substring(1)));
        };
    };
});
