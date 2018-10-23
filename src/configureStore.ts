import { History } from 'history';
import { routerMiddleware, routerReducer } from 'react-router-redux';
import { applyMiddleware, combineReducers, compose, createStore, GenericStoreEnhancer, ReducersMapObject, Store, StoreEnhancerStoreCreator } from 'redux';
import thunk from 'redux-thunk';
import { ApplicationState, reducers } from './store';

export default function configureStore(history: History, initialState?: ApplicationState) {
    const windowIfDefined = typeof window === 'undefined' ? null : window as any;
    const devToolsExtension = windowIfDefined && windowIfDefined.__REDUX_DEVTOOLS_EXTENSION__ as () => GenericStoreEnhancer;
    const createStoreWithMiddleware = compose<any>(
        applyMiddleware(thunk, routerMiddleware(history)),
        devToolsExtension ? devToolsExtension() : <S>(next: StoreEnhancerStoreCreator<S>) => next
    )(createStore);
    const allReducers = buildRootReducer(reducers);
    const store = createStoreWithMiddleware(allReducers, initialState) as Store<ApplicationState>;
    return store;
}

const buildRootReducer = (allReducers: ReducersMapObject): any => {
    return combineReducers(Object.assign({}, allReducers, { routing: routerReducer }));
}