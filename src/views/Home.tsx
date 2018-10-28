import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { connect } from 'react-redux';
import { Button, Col, Container, Row, InputGroup, InputGroupAddon, Input } from 'reactstrap';
import CNavbar from '../containers/App/navbar';
import { ApplicationState } from '../store';
import * as oscad from '@jscad/csg/api';
import { Processor } from '../containers/Viewer/processor';
import { STLLoader } from '../utils/STLLoader';
import BlockUi from 'react-block-ui';

class Channels extends React.Component<any, any>{
  constructor(props) {
    super(props);

    this.state = { 
      items: [],
      blocking: false,
      viewerOptions: {
        viewer: {
          plate: {
            draw: true,
            size: 1000
          },
          camera: {
            position: { x: 0, y: 0, z: 1000 },
            clip: { min: 0.5, max: 3000 }
          },
          axis: {
            draw: true
          },
          solid: {
            draw: true
          }
        }
      }
    };

    this.viewer = React.createRef();
    this.editor = React.createRef();
    this.fileInput = React.createRef();
  }

  toggleBlocking() {
    this.setState({ blocking: !this.state.blocking });
  }

  componentDidMount() {
    this.csgViewer = new Processor(this.viewer.current, this.state.viewerOptions)
  }

  renderCsg() {
    this.toggleBlocking();
    const { items } = this.state;
    new Promise((resolve, reject) => {
      var sdItems = [];
      items.forEach((item) => {
        const polyhedron = oscad.primitives3d.polyhedron(item.value);
        sdItems.push(polyhedron);
      });
      this.csgViewer.setCurrentObjects(sdItems);
      resolve();
    }).then(() => {
      this.toggleBlocking()
    })
      .catch((ex) => {
        console.error(ex);
        // this.toggleBlocking()
      });
  }

  viewer: any;
  csgViewer: any;
  editor: any;
  fileInput: any;

  addButtonClick = (e) => {
    if (this.fileInput.files.length == 0) {

    } else {
      this.toggleBlocking();
      const loader = new STLLoader();
      loader.load(this.fileInput.files[0]).then((data) => {
        this.toggleBlocking();
        const { items } = this.state;
        items.push({ name: this.fileInput.files[0].name, value: data });
        this.setState(items);
      }).catch(ex => {
        this.toggleBlocking();
        console.log(ex)
      });
    }
  }

  render() {
    const options = {
    };
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

              </Col>
            </Row>
          </Col>
          <Col md="6">
            <div style={{
              height: 800
            }} ref={this.viewer}>
            </div>
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