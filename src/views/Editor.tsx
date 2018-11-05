import * as oscad from '@jscad/csg/api';
import * as React from 'react';
import { Button, Col, InputGroup, InputGroupAddon, Row } from 'reactstrap';
import Processor from '../containers/Editor/Processor';
import { STLLoader } from '../utils/STLLoader';
import ItemView from './ItemView';

export class Editor extends React.Component<any, any>{
    constructor(props) {
        super(props);
        this.viewer = React.createRef();
        this.code = React.createRef();
        this.fileInput = React.createRef();

        this.state = {
            items: [],
            blocking: false
        }
    }
    gProcessor: Processor = null;
    viewer: any;
    code: any;
    fileInput: any;

    componentDidMount() {
        // OpenJsCad.AlertUserOfUncaughtExceptions();
        console.log(this.viewer.current);
        this.gProcessor = new Processor(this.viewer.current, null, null);
        // this.updateSolid();
    }
    updateSolid() {
        this.gProcessor.setRenderedObjects(this.code.editor.getValue());
    }
    refreshButtonClick(event) {
        this.updateSolid();
    }

    toggleBlocking() {
        // this.setState({ blocking: !this.state.blocking });
    }
    renderCsg() {
        this.toggleBlocking();
        const { items } = this.state;
        new Promise((resolve, reject) => {
            var sdItems = items.map((item) => {
                return oscad.primitives3d.polyhedron(item.value)
            });

            this.setState({ items: [] })
            this.gProcessor.renderItems(sdItems);
            sdItems = undefined;
            resolve();
        }).then(() => {
            this.toggleBlocking()
        })
            .catch((ex) => {
                console.error(ex);
                // this.toggleBlocking()
            });
    }
    addButtonClick = (e) => {
        if (this.fileInput.files.length == 0) {

        } else {
            this.toggleBlocking();
            const loader = new STLLoader();
            loader.load(this.fileInput.files[0]).then((data) => {
                this.toggleBlocking();
                const { items } = this.state;
                // items.push({ name: this.fileInput.files[0].name, value: oscad.primitives3d.polyhedron(data) });
                items.push({ name: this.fileInput.files[0].name, value: data });
                console.log(items);
                this.setState(items);
            }).catch(ex => {
                this.toggleBlocking();
                console.log(ex)
            });
        }
    }
    render() {
        return <Row>
            <Col md="6">
                <Col md="12">
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
                </Col>
                <Col md="12">
                    {
                        this.state.items.map((item, index) => {
                            return <ItemView key={index}
                                renderer={null}
                                data={item}
                                onDelete={(event) => {
                                    const { items } = this.state;
                                    items.splice(index, 1);
                                    // this.renderer.Delete(item.index);
                                    this.setState(items);
                                }} />
                        })
                    }
                </Col>
            </Col>
            <Col md="6">
                <div ref={this.viewer}></div>
            </Col>
        </Row>;
    }
}

export default Editor;