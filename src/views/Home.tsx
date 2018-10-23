import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { Col, Container, ListGroup, ListGroupItem, Row } from 'reactstrap';
import CNavbar from '../containers/App/navbar';
import { ApplicationState } from '../store';
import { rebuildSolids } from '@jscad/core/code-evaluation/rebuildSolids';
import { stlDeSerializer } from '@jscad/io';
import * as scad from '@jscad/scad-api';
import * as makeCsgViewer from '@jscad/csg-viewer';


class Channels extends React.Component<any, any>{
    constructor(props) {
        super(props);
        this.viewer = React.createRef();
    }

    componentDidMount() {
        const text: string = "\
        function main () { \
          return union(\
            difference(\
              cube({size: 3, center: true}),\
              sphere({r: 2, center: true})\
            ),\
            intersection(\
              sphere({r: 1.3, center: true}),\
              cube({size: 2.1, center: true})\
            )\
          ).translate([0, 0, 1.5]).scale(10);\
        }";

        const viewerOptions ={
            camera: {
              fov: 45,                           // field of view
              angle: {x: -60, y: 0, z: -45},  // view angle about XYZ axis
              position: [ 0, 0, 100],  // initial position at XYZ
              clip: {min: 0.5, max: 1000}  // rendering outside this range is clipped
            },
            plate: {
              draw: true,                // draw or not
              size: 200,                 // plate size (X and Y)
              // minor grid settings
              m: {
                i: 1, // number of units between minor grid lines
                color: {r: 0.8, g: 0.8, b: 0.8, a: 0.5} // color
              },
              // major grid settings
              M: {
                i: 10, // number of units between major grid lines
                color: {r: 0.5, g: 0.5, b: 0.5, a: 0.5} // color
              }
            },
            axis: {
              draw: false,                // draw or not
              x: {
                neg: {r: 1.0, g: 0.5, b: 0.5, a: 0.5}, // color in negative direction
                pos: {r: 1.0, g: 0, b: 0, a: 0.8} // color in positive direction
              },
              y: {
                neg: {r: 0.5, g: 1.0, b: 0.5, a: 0.5}, // color in negative direction
                pos: {r: 0, g: 1.0, b: 0, a: 0.8} // color in positive direction
              },
              z: {
                neg: {r: 0.5, g: 0.5, b: 1.0, a: 0.5}, // color in negative direction
                pos: {r: 0, g: 0, b: 1.0, a: 0.8} // color in positive direction
              }
            },
            solid: {
              draw: true,              // draw or not
              lines: false,             // draw outlines or not
              faces: true,
              overlay: false,             // use overlay when drawing lines or not
              smooth: false,             // use smoothing or not
              faceColor: {r: 1.0, g: 0.4, b: 1.0, a: 1.0},        // default face color
              outlineColor: {r: 0.0, g: 0.0, b: 0.0, a: 0.1}        // default outline color
            },
            background: {
              color: {r: 0.93, g: 0.93, b: 0.93, a: 1.0}
            }
          }

        const { csgViewer, viewerDefaults, viewerState$ } = makeCsgViewer(this.viewer.current, viewerOptions)
        console.log(stlDeSerializer);
        rebuildSolids(text, "", null, (err, objects) => {
            csgViewer(viewerOptions, { solids: objects })
        });
    }
    viewer: any;
    render() {
        return <Container fluid tabIndex={0}>
            <CNavbar />
            <div className="clearfix dd" style={{ padding: '.5rem' }}></div>
            <Row>
                <Col md="6">

                </Col>
                <Col md="6">
                    <canvas ref={this.viewer} id="editor"></canvas>
                </Col>
            </Row>

        </Container >;
    }
}

// export default Channels;
export default connect(
    (state: ApplicationState) => state
)(Channels);