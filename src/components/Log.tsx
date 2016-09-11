import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";

import { Job } from "../stores/Stores";

export class JobLogView extends React.Component<{
  job: Job
}, {
  text: string
}> {
  constructor() {
    super();
    this.state = {text: ""};
  }
  componentWillMount() {
    let job = this.props.job;
    if (job) {
      job.onLogTextChange.attach(() => {
        this.setState({text: job.logText} as any);
      });
    }
  }

  render() {
    let job = this.props.job;
    if (job) {
      return <pre className="log" style={{height: "512px", overflow: "scroll"}}>{job.logText}</pre>;
    }
    return null;
  }
}
