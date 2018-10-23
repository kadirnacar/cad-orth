import * as React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from '../../views/Home';

class App extends React.Component<any, any>{

    render() {
        return <BrowserRouter>
            <Switch>
                <Route exact path="/" component={Home} />
            </Switch>
        </BrowserRouter>;
    }
}

export default App;