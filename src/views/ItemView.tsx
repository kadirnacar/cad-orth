import Slider, { Handle } from 'rc-slider';
import Tooltip from 'rc-tooltip';
import * as React from 'react';
import { Button, ButtonGroup, Card, CardBody, CardHeader, Col, Collapse, Form, FormGroup, Label, Row } from 'reactstrap';

const handle = (props) => {
    const { value, dragging, index, ...restProps } = props;

    return (
        <Tooltip
            prefixCls="rc-slider-tooltip"
            overlay={value}
            visible={dragging}
            placement="top"
            key={index}
        >
            <Handle value={value} {...restProps} />
        </Tooltip>
    );
};
class ItemView extends React.Component<any, any>{
    constructor(props) {
        super(props);
        this.state = {
            rotate: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            collapse: true
        };
    }
    toggle() {
        this.setState({ collapse: !this.state.collapse });
    }

    render() {
        return <Card>
            <CardHeader>
                {this.props.data.name}
                <ButtonGroup className="float-right">
                    <Button outline color="secondary" size="sm" onClick={this.toggle.bind(this)}>
                        <i className={"fa " + (this.state.collapse ? "fa-chevron-circle-up" : "fa-chevron-circle-down")} />
                    </Button>
                    <Button color="danger" size="sm" onClick={this.props.onDelete ? this.props.onDelete.bind(this) : null}>
                        <i className="fa fa-trash" />
                    </Button>
                </ButtonGroup>
            </CardHeader>
            <Collapse isOpen={this.state.collapse}>
                <CardBody>
                    <Form>
                        <Row>
                            <Col xs="6">
                                <FormGroup row>
                                    <Label sm={2}>ScaleX ({this.state.scale.x})</Label>
                                    <Col sm={10}>
                                        <Slider style={{ paddingTop: 16 }}
                                            min={0}
                                            max={2}
                                            step={0.01}
                                            defaultValue={1}
                                            onChange={(value) => {
                                                const { scale } = this.state;
                                                scale.x = value;
                                                this.props.renderer.setScale(scale, this.props.data.index);
                                                this.setState(scale);
                                            }}
                                            handle={handle} />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label sm={2}>ScaleY ({this.state.scale.y})</Label>
                                    <Col sm={10}>
                                        <Slider style={{ paddingTop: 16 }}
                                            min={0}
                                            max={2}
                                            step={0.01}
                                            defaultValue={1}
                                            onChange={(value) => {
                                                const { scale } = this.state;
                                                scale.y = value;
                                                this.props.renderer.setScale(scale, this.props.data.index);
                                                this.setState(scale);
                                            }}
                                            handle={handle} />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label sm={2}>ScaleZ ({this.state.scale.z})</Label>
                                    <Col sm={10}>
                                        <Slider style={{ paddingTop: 16 }}
                                            min={0}
                                            max={2}
                                            step={0.01}
                                            defaultValue={1}
                                            onChange={(value) => {
                                                const { scale } = this.state;
                                                scale.z = value;
                                                this.props.renderer.setScale(scale, this.props.data.index);
                                                this.setState(scale);
                                            }}
                                            handle={handle} />
                                    </Col>
                                </FormGroup>
                            </Col>
                            <Col xs="6">
                                <FormGroup row>
                                    <Label sm={2}>RotateX ({this.state.rotate.x})</Label>
                                    <Col sm={10}>
                                        <Slider style={{ paddingTop: 16 }}
                                            min={-180}
                                            max={180}
                                            defaultValue={0}
                                            onChange={(value) => {
                                                const { rotate } = this.state;
                                                rotate.x = value;
                                                this.props.renderer.setRotate(rotate, this.props.data.index);
                                                this.setState(rotate);
                                            }}
                                            handle={handle} />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label sm={2}>RotateY ({this.state.rotate.y})</Label>
                                    <Col sm={10}>
                                        <Slider style={{ paddingTop: 16 }}
                                            min={-180}
                                            max={180}
                                            defaultValue={0}
                                            onChange={(value) => {
                                                const { rotate } = this.state;
                                                rotate.y = value;
                                                this.props.renderer.setRotate(rotate, this.props.data.index);
                                                this.setState(rotate);
                                            }}
                                            handle={handle} />
                                    </Col>
                                </FormGroup>
                                <FormGroup row>
                                    <Label sm={2}>RotateZ ({this.state.rotate.z})</Label>
                                    <Col sm={10}>
                                        <Slider style={{ paddingTop: 16 }}
                                            min={-180}
                                            max={180}
                                            defaultValue={0}
                                            onChange={(value) => {
                                                const { rotate } = this.state;
                                                rotate.z = value;
                                                this.props.renderer.setRotate(rotate, this.props.data.index);
                                                this.setState(rotate);
                                            }}
                                            handle={handle} />
                                    </Col>
                                </FormGroup>
                            </Col>
                        </Row>
                    </Form>
                </CardBody>
            </Collapse>
        </Card>
    }
}

export default ItemView;