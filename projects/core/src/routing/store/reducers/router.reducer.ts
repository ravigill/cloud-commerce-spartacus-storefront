import { InjectionToken, Provider } from '@angular/core';
import { Params, RouterStateSnapshot } from '@angular/router';

import {
  ActionReducerMap,
  createFeatureSelector,
  createSelector,
  MemoizedSelector,
} from '@ngrx/store';
import * as fromNgrxRouter from '@ngrx/router-store';

import * as fromActions from '../actions';
import { ROUTING_FEATURE } from '../../state';
import { PageContext } from '../../models/page-context.model';
import { PageType } from '../../../occ/occ-models/index';
import { CmsActivatedRouteSnapshot } from '../../models/cms-route';

export interface RouterState
  extends fromNgrxRouter.RouterReducerState<ActivatedRouterStateSnapshot> {
  redirectUrl: string;
  nextState?: ActivatedRouterStateSnapshot;
}

export const initialState: RouterState = {
  redirectUrl: '',
  navigationId: 0,
  state: {
    url: '',
    queryParams: {},
    params: {},
    context: {
      id: '',
    },
    cmsRequired: false,
  },
  nextState: undefined,
};

export interface ActivatedRouterStateSnapshot {
  url: string;
  queryParams: Params;
  params: Params;
  context: PageContext;
  cmsRequired: boolean;
}

export interface State {
  router: RouterState;
}

export function getReducers(): ActionReducerMap<State> {
  return {
    router: reducer,
  };
}

export function reducer(
  state: RouterState = initialState,
  action: any
): RouterState {
  switch (action.type) {
    case fromActions.SAVE_REDIRECT_URL: {
      return {
        ...state,
        redirectUrl: action.payload,
      };
    }
    case fromActions.CLEAR_REDIRECT_URL: {
      return {
        ...state,
        redirectUrl: '',
      };
    }
    case fromNgrxRouter.ROUTER_NAVIGATION: {
      return {
        ...state,
        nextState: action.payload.routerState,
        navigationId: action.payload.event.id,
      };
    }

    case fromNgrxRouter.ROUTER_NAVIGATED:
    case fromNgrxRouter.ROUTER_ERROR:
    case fromNgrxRouter.ROUTER_CANCEL: {
      const currentUrl = action.payload.routerState
        ? action.payload.routerState.url
        : '';
      const contextId = action.payload.routerState
        ? action.payload.routerState.context.id
        : '';
      let redirectUrl;
      if (
        contextId === 'login' ||
        contextId === 'register' ||
        currentUrl === state.redirectUrl
      ) {
        redirectUrl = state.redirectUrl;
      } else {
        redirectUrl = '';
      }

      return {
        redirectUrl: redirectUrl,
        state: action.payload.routerState,
        navigationId: action.payload.event.id,
        nextState: undefined,
      };
    }
    default: {
      return state;
    }
  }
}

export const reducerToken: InjectionToken<
  ActionReducerMap<State>
> = new InjectionToken<ActionReducerMap<State>>('RouterReducers');

export const reducerProvider: Provider = {
  provide: reducerToken,
  useFactory: getReducers,
};

export const getRouterFeatureState: MemoizedSelector<
  any,
  State
> = createFeatureSelector<State>(ROUTING_FEATURE);

export const getRouterState: MemoizedSelector<
  any,
  RouterState
> = createSelector(
  getRouterFeatureState,
  state => state.router
);

export const getPageContext: MemoizedSelector<
  any,
  PageContext
> = createSelector(
  getRouterState,
  (routingState: RouterState) => routingState.state.context
);

export const getNextPageContext: MemoizedSelector<
  any,
  PageContext
> = createSelector(
  getRouterState,
  (routingState: RouterState) =>
    routingState.nextState && routingState.nextState.context
);

export const isNavigating: MemoizedSelector<any, boolean> = createSelector(
  getNextPageContext,
  context => !!context
);

export const getRedirectUrl: MemoizedSelector<any, string> = createSelector(
  getRouterState,
  state => state.redirectUrl
);

/* The serializer is there to parse the RouterStateSnapshot,
and to reduce the amount of properties to be passed to the reducer.
 */
export class CustomSerializer
  implements
    fromNgrxRouter.RouterStateSerializer<ActivatedRouterStateSnapshot> {
  serialize(routerState: RouterStateSnapshot): ActivatedRouterStateSnapshot {
    const { url } = routerState;
    const { queryParams } = routerState.root;

    let state: CmsActivatedRouteSnapshot = routerState.root as CmsActivatedRouteSnapshot;
    let cmsRequired = false;
    let context: PageContext;

    while (state.firstChild) {
      state = state.firstChild as CmsActivatedRouteSnapshot;

      // we use context information embedded in Cms driven routes from any parent route
      if (state.data && state.data.cxCmsRouteContext) {
        context = state.data.cxCmsRouteContext;
      }

      // we assume, that any route that has CmsPageGuard or it's child
      // is cmsRequired
      if (
        !cmsRequired &&
        (context ||
          (state.routeConfig &&
            state.routeConfig.canActivate &&
            state.routeConfig.canActivate.find(
              x => x && x.guardName === 'CmsPageGuard'
            )))
      ) {
        cmsRequired = true;
      }
    }
    const { params } = state;

    // we give smartedit preview page a PageContext
    if (state.url.length > 0 && state.url[0].path === 'cx-preview') {
      context = {
        id: 'smartedit-preview',
        type: PageType.CONTENT_PAGE,
      };
    } else {
      if (params['productCode']) {
        context = { id: params['productCode'], type: PageType.PRODUCT_PAGE };
      } else if (params['categoryCode']) {
        context = { id: params['categoryCode'], type: PageType.CATEGORY_PAGE };
      } else if (params['brandCode']) {
        context = { id: params['brandCode'], type: PageType.CATEGORY_PAGE };
      } else if (params['query']) {
        context = { id: 'search', type: PageType.CONTENT_PAGE };
      } else if (state.data.pageLabel !== undefined) {
        context = { id: state.data.pageLabel, type: PageType.CONTENT_PAGE };
      } else if (!context) {
        if (state.url.length > 0) {
          const pageLabel =
            '/' + state.url.map(urlSegment => urlSegment.path).join('/');
          context = {
            id: pageLabel,
            type: PageType.CONTENT_PAGE,
          };
        } else {
          context = {
            id: 'homepage',
            type: PageType.CONTENT_PAGE,
          };
        }
      }
    }

    return { url, queryParams, params, context, cmsRequired };
  }
}
