import * as React from 'react';
import { connect } from 'react-redux';
import { Button, Col, Container, Row, InputGroup, InputGroupAddon } from 'reactstrap';
import CNavbar from '../containers/App/navbar';
import ItemView from './ItemView';
import { ApplicationState } from '../store';
import Renderer from '../utils/Renderer';
import BlockUi from 'react-block-ui';


class Channels extends React.Component<any, any>{
  constructor(props) {
    super(props);

    this.state = {
      items: [],
      blocking: false
    };

    this.viewer = React.createRef();
    this.editor = React.createRef();
    this.fileInput = React.createRef();
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  componentDidMount() {
    this.renderer = new Renderer(this.viewer.current as HTMLCanvasElement);
  }

  viewer: any;
  csgViewer: any;
  editor: any;
  fileInput: any;
  renderer: Renderer;

  addButtonClick = (e) => {
    if (this.fileInput.files.length == 0) {

    } else {
      this.toggleBlocking();
      this.renderer.loadStl(this.fileInput.files[0])
        .then((data) => {
          const { items } = this.state;
          items.push({ name: this.fileInput.files[0].name, index: data });
          this.setState(items);
          this.toggleBlocking();
        }).catch(ex => {
          this.toggleBlocking();
          console.log(ex)
        });
    }
  }
  renderCsg() {
  }
  render() {

    return <Container fluid tabIndex={0}>
      <CNavbar />
      <div className="clearfix dd" style={{ padding: '.5rem' }}></div>
      <BlockUi tag="div" blocking={this.state.blocking}>
        <Row>
          <Col md="6">
            <Row>
              <Col xs="12">
                <Button color="primary" onClick={this.renderCsg.bind(this)}><i className="fa fa-refresh" /> Render</Button>
              </Col>
            </Row>
            <Row>
              <Col xs="12">
                <InputGroup>
                  <input className="form-control" type="file" ref={(a) => { this.fileInput = a; }} accept=".stl" />
                  <InputGroupAddon addonType="append"><Button onClick={this.addButtonClick.bind(this)}>Ekle</Button></InputGroupAddon>
                </InputGroup>
              </Col>
            </Row>
            <Row>
              <Col xs="12">
                {
                  this.state.items.map((item, index) => {
                    return <ItemView key={index}
                      renderer={this.renderer}
                      data={item}
                      onDelete={(event) => {
                        const { items } = this.state;
                        items.splice(index, 1);
                        this.renderer.Delete(item.index);
                        this.setState(items);
                      }} />
                  })
                }
              </Col>
            </Row>
          </Col>
          <Col md="6">
            <canvas style={{
              width: '100%',
              height: 800
            }} ref={this.viewer}>
            </canvas>
          </Col>
        </Row>
      </BlockUi>
    </Container >;
  }
}

// export default Channels;
export default connect(
  (state: ApplicationState) => state
)(Channels);