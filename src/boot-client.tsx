import 'font-awesome/css/font-awesome.css';
import 'monaco-editor/min/vs/editor/editor.main.css';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';
import { Provider } from 'react-redux';
import configureStore from './configureStore';
import App from './containers/App';
import history from './history';

const initialState = (window as any).initialReduxState;
const store = configureStore(history, initialState);

function renderApp(App) {
    ReactDOM.render(
        <AppContainer>
            <Provider store={store}>
                <App />
            </Provider>
        </AppContainer>,
        document.getElementById('react-root')
    );
}


renderApp(App);

if (module.hot) {
    module.hot.accept('./containers/App/index', () => {
        const App2 = require('./containers/App/index').default;
        renderApp(App2);
    });
}