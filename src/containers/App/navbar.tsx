import * as React from 'react';
import { NavLink as RNavLink } from 'react-router-dom';
import { Nav, Navbar, NavbarBrand, NavItem, NavLink } from 'reactstrap';

class CNavbar extends React.Component<any, any>{

    render() {
        return <Navbar color="dark" dark expand="md">
            <NavbarBrand href="/">Cad Editor</NavbarBrand>
            <Nav className="ml-auto" navbar>
                <NavItem>
                    <NavLink tag={RNavLink} to="/">Anasayfa</NavLink>
                </NavItem>
                <NavItem>
                    <NavLink tag={RNavLink} to="/editor">Editor</NavLink>
                </NavItem>
            </Nav>
        </Navbar>;
    }
}

export default CNavbar;