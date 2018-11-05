import * as React from 'react';
import { BrowserRouter, Route, Switch } from 'react-router-dom';
import Home from '../../views/Home';
import Editor from '../../views/Editor';
import { Container } from 'reactstrap';
import CNavbar from './navbar';

class App extends React.Component<any, any>{

    render() {
        return <Container fluid tabIndex={0}>
            <div className="clearfix dd" style={{ padding: '.5rem' }}></div>
            <BrowserRouter>
                <div>
                    <CNavbar />
                    <Switch>
                        <Route exact path="/" component={Home} />
                        <Route path="/editor" component={Editor} />
                    </Switch>
                </div>
            </BrowserRouter>
        </Container >;
    }
}

export default App;