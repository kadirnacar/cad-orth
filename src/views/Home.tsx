import * as oscad from '@jscad/csg/api';
import * as React from 'react';
import BlockUi from 'react-block-ui';
import { connect } from 'react-redux';
import { Button, Col, InputGroup, InputGroupAddon, Row } from 'reactstrap';
import { Processor } from '../containers/Viewer/processor';
import { ApplicationState } from '../store';
import { STLLoader } from '../utils/STLLoader';

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
        // const polyhedron =oscad.booleanOps.intersection(oscad.primitives3d.cube(200), item.value);
        sdItems.push(item.value);
      });
      this.setState({ items: [] })
      this.csgViewer.setCurrentObjects(sdItems);
      sdItems=undefined;
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
        items.push({ name: this.fileInput.files[0].name, value: oscad.primitives3d.polyhedron(data) });
        console.log(items);
        this.setState(items);
      }).catch(ex => {
        this.toggleBlocking();
        console.log(ex)
      });
    }
  }

  render() {
    
    return <BlockUi tag="div" blocking={this.state.blocking}>
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
    ;
  }
}

// export default Channels;
export default connect(
  (state: ApplicationState) => state
)(Channels);