import { rebuildSolids } from '@jscad/core/code-evaluation/rebuildSolids';
import * as makeCsgViewer from '@jscad/csg-viewer';
import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { connect } from 'react-redux';
import { Button, Col, Container, Row } from 'reactstrap';
import CNavbar from '../containers/App/navbar';
import { ApplicationState } from '../store';

class Channels extends React.Component<any, any>{
  constructor(props) {
    super(props);
    this.state = {
      text: "\
    function main () { \r\
      return union(\r\
        difference(\r\
          cube({size: 3, center: true}),\r\
          sphere({r: 2, center: true})\r\
        ),\r\
        intersection(\r\
          sphere({r: 1.3, center: true}),\r\
          cube({size: 2.1, center: true})\r\
        )\r\
      ).translate([0, 0, 1.5]).scale(10);\r\
    }" ,
      viewerOptions: {
        rendering: {
          background: [0.211, 0.2, 0.207, 1], // [1, 1, 1, 1],//54, 51, 53
          meshColor: [0.4, 0.6, 0.5, 1]
        },
        grid: {
          show: true,
          color: [1, 1, 1, 1]
        },
        camera: {
          position: [0, 0, 100]
        },
        controls: {
          zoomToFit: {
            targets: 'all'
          },
          limits: {
            maxDistance: 1600,
            minDistance: 0.01
          }
        }
      }
    };
    this.viewer = React.createRef();
    this.editor = React.createRef();
  }

  componentDidMount() {
    this.csgViewer = makeCsgViewer(this.viewer.current, this.state.viewerOptions).csgViewer;
    // this.renderCsg(true);
  }
  renderCsg(options) {
    this.setState({ text: this.editor.editor.getValue() });
    rebuildSolids(this.editor.editor.getValue(), "", null, (err, objects) => {
      if (options)
        this.csgViewer(this.state.viewerOptions, { solids: objects });
      else
        this.csgViewer({}, { solids: objects });
    });
  }
  viewer: any;
  csgViewer: any;
  editor: any;
  render() {
    const options = {
    };
    return <Container fluid tabIndex={0}>
      <CNavbar />
      <div className="clearfix dd" style={{ padding: '.5rem' }}></div>
      <Row>
        <Col md="6">
          <Row>
            <Col xs="12">
              <Button color="warning" onClick={() => { this.editor.editor.getAction('editor.action.formatDocument').run(); }}><i className="fa fa-refresh" /> Format</Button>
              <Button color="primary" onClick={() => { this.renderCsg(false); }}><i className="fa fa-refresh" /> Yenile</Button>

            </Col>
            <Col xs="12">
              <MonacoEditor ref={(a) => { this.editor = a; }}
                language="javascript" height="600" theme="vs-dark"
                options={options}
                value={this.state.text}
              />
            </Col>
          </Row>

        </Col>
        <Col md="6">
          <div style={{
            width: "100%",
            minHeight: 800,
            border: "1px solid",
            position: "relative"
          }} ref={this.viewer} id="editor">
          </div>
        </Col>
      </Row>

    </Container >;
  }
}

// export default Channels;
export default connect(
  (state: ApplicationState) => state
)(Channels);