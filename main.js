import Observable from 'zen-observable';
import {Action,Result,Types,Effect} from 'effectjs';

export const Actions = Types('gotoPage', 'urlChanged', 'pageAction');

const init = (router) => (startpage, ...args) => {
    const {pages} = router;
    const page = pages[startpage].component;
    const result = page.init(...args);
    return result.then((pageState, pageEffect) => {
        return Result(
            {
                page: page,
                pageState: pageState,
                pages: pages,
            },
            pageEffect.map(Action.wrap(Actions.pageAction, {page: page}))
        );
    });
};

const updateHash = (hash) => {
    return Effect.call((hash) => {
        history.pushState(null,null,'#'+hash);
        return []; //No actions created
    }, hash);
};

const update = (router) => (state, action) => {
    const {type, data} = action;
    if(type === Actions.gotoPage) {
        const {page: pagename, args: args = []} = data;
        const {pages} = state;
        const page = pages[pagename].component;
        return page.init(...args)
        .then((pageState, pageEffect) => {
            return Result(
                {
                    page: page,
                    pageState: pageState,
                    pages,
                },
                Effect.all([
                    pageEffect.map(Action.wrap(Actions.pageAction, {page: page})),
                    updateHash(pagename)
                ])
            );
        });
    } else if(type === Actions.urlChanged) {

    } else if(type === Actions.pageAction) {
        const {pageState, page, pages} = state;
        const {page: actionPage} = data;
        if(page !== actionPage) {
            return Result(state); //Do not handle actions for pages not shown
        }
        const pageAction = Action.unwrap(action);
        return page.update(pageState, pageAction)
        .then((nextPageState, nextPageEffect) => {
            return Result(
                {
                    page: page,
                    pageState: nextPageState,
                    pages,
                },
                nextPageEffect.map(Action.wrap(Actions.pageAction, {page: page}))
            );
        });
    }
};

const view = (router) => (state, next) => {
    return state.page.view(
        state.pageState,
        Action.to(next, Actions.pageAction, {page: state.page})
    );
};


const Router = (pages, elsePage) => {
    return {
        pages,
        elsePage,
        when(url, config) {
            const {pages, elsePage} = this;
            if(elsePage) {
                throw new Error('Cannot chain whens after else');
            }
            pages[url] = config;
            return Router(pages, elsePage);
        },
        else(config) {
            const {pages} = this;
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
}


export default () => {
    return Router({},undefined);
};

export const inputs = new Observable(observer => {
    if(window && 'onhashchange' in window) {
        winow.onhashchange = () => {
            observer.next(Action(Actions.urlChanged, window.location.hash.substring(1)));
        };
    };
});

