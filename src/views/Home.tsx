import { rebuildSolids,rebuildSolidsInWorker } from '@jscad/core/code-evaluation/rebuildSolids';
import * as makeCsgViewer from '@jscad/csg-viewer';
import * as React from 'react';
import MonacoEditor from 'react-monaco-editor';
import { connect } from 'react-redux';
import { Button, Col, Container, Row } from 'reactstrap';
import CNavbar from '../containers/App/navbar';
import { ApplicationState } from '../store';
// import { stlDeSerializer } from '@jscad/io';
import * as stlDeSerializer from '../containers/Viewer/deserializer';
import * as Viewer from '../containers/Viewer';
import * as Processor from '../containers/Viewer/processor';

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
          position: [10000, 10000, 10000]
        },
        controls: {
          zoomToFit: {
            targets: 'all'
          },
          limits: {
            maxDistance: 16000,
            minDistance: 0.01
          }
        }
      }
    };
    this.viewer = React.createRef();
    this.editor = React.createRef();
  }

  componentDidMount() {
    // this.csgViewer = new Viewer(this.viewer.current, {})
    // this.csgViewer = new Processor(this.viewer.current, {
    //   viewer: {
    //     plate: {
    //       size: 1000,
    //       m: {
    //         i: 1,
    //         color: { r: 0.3, g: 0.3, b: 0.3, a: 0.5 }
    //       },
    //       M: {
    //         i: 1,
    //         color: { r: 0.9, g: 0.9, b: 0.9, a: 0.5 }
    //       }
    //     },
    //     camera: {
    //       position: { x: 0, y: 0, z: 1000 },
    //       clip: { min: 0.5, max: 3000 }
    //     },
    //     axis: {
    //       draw: true
    //     }
    //   }
    // })
    // console.log(gProcessor);
    this.csgViewer = makeCsgViewer(this.viewer.current, this.state.viewerOptions).csgViewer;
    // this.renderCsg(true);
  }
  renderCsg(options) {

    // this.csgViewer.setJsCad(this.state.text, this.state.filename);
    rebuildSolids(this.editor.editor.getValue(), "", {}, (err, objects) => {
      console.log(err,objects);
      if (options)
        this.csgViewer(this.state.viewerOptions, { solids: objects });
      else
        this.csgViewer(this.state.viewerOptions, { solids: objects });
    });
  }
  viewer: any;
  csgViewer: any;
  editor: any;

  onStlFileChanged = (e) => {
    const { files } = e.target;
    const fileReader: FileReader = new FileReader();
    function convert(buffer) {
      let binary = ''
      const bytes = new Uint8Array(buffer)
      let length = bytes.byteLength
      for (let i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i])
      }
      return binary
    }
    fileReader.onloadend = (ev) => {
      if (fileReader.result) {
        const converted = stlDeSerializer.deserialize(convert(fileReader.result), files[0].name, { version: "1.9.0", addMetaData: false, name: "deneme" });
        const endfix="\nfunction main() {\n\
          var p = polyhedron(deneme).rotateY(-45);\n\
          return difference(\n\
            p,\n\
            difference(p, cube({ size: [120, 250, 150], center: [1, 1, 0] }))\n\
            );\n\
        }";
        this.setState({ text: converted+endfix, filename: files[0].name });
      }
    };
    fileReader.readAsArrayBuffer(files[0]);
    console.log(files);
  }
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
              <Button color="primary" onClick={() => { this.renderCsg(false); }}><i className="fa fa-refresh" /> Render</Button>
            </Col>
          </Row>
          <Row>
            <Col xs="12">
              <input type="file" accept=".stl" onChange={this.onStlFileChanged.bind(this)} />
            </Col>
          </Row>
          <Row>
            <Col xs="12">
              <MonacoEditor ref={(a) => { this.editor = a; }}
                language="javascript" height="600" theme="vs-dark"
                options={options}
                onChange={() => { this.setState({ text: this.editor.editor.getValue() }); }}
                value={this.state.text}
              />
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

    </Container >;
  }
}

// export default Channels;
export default connect(
  (state: ApplicationState) => state
)(Channels);