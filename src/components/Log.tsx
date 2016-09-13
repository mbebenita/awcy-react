import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Table, Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";
import { Job, Jobs, AppStore } from "../stores/Stores";
import { JobListItem } from "./Jobs";

export class Log extends React.Component<{
  job: Job
}, {
    text: string
  }> {
  constructor() {
    super();
    this.state = { text: "" };
  }
  componentDidMount() {
    let job = this.props.job;
    if (job) {
      job.onChange.attach(() => {
        this.setState({ text: job.log } as any);
      });
    }
  }
  render() {
    return <pre className="log" style={{ height: "256px", overflow: "scroll" }}>{this.state.text}</pre>;
  }
}

export class AppStatus extends React.Component<{
  store: AppStore
}, {
    runningJob: Job;
    aws: any;
  }> {
  constructor() {
    super();
    this.state = {
      runningJob: null
    };
  }
  componentDidMount() {
    let store = this.props.store;
    store.onRunningJobChange.attach(() => {
      this.setState({
        runningJob: store.runningJob,
      } as any);
    });
    store.onAWSChange.attach(() => {
      this.setState({
        aws: store.aws
      } as any);
    });
  }
  render() {
    console.debug("Rendering Log");
    let table = null;
    let status = "";
    if (this.state.aws) {
      let autoScalingInstances = this.state.aws.AutoScalingInstances;
      if (autoScalingInstances) {
        let rows = autoScalingInstances.map(instance => [
          <tr>
            <td className="tableStringValue">{instance.InstanceId}</td>
            <td className="tableStringValue">{instance.HealthStatus}</td>
            <td className="tableStringValue">{instance.LifecycleState}</td>
          </tr>
        ]);
        table = <Table striped bordered condensed hover style={{width: "100%"}}>
          <thead>
            <tr>
              <th className="tableHeader">ID</th>
              <th className="tableHeader">Health Status</th>
              <th className="tableHeader">Lifecycle State</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      }
      let autoScalingGroups = this.state.aws.AutoScalingGroups;
      if (autoScalingGroups) {
        var group = autoScalingGroups[0];
        var desired = group.DesiredCapacity;
        var actual = group.Instances.length;
        if (desired > 0) {
          status = `(${actual} of ${desired} machines have started.)`;
        } else {
          status = "(All machines are currently offline.)";
        }
      }
    }
    let info = null;
    let log = null;
    if (this.state.runningJob) {
      info = <Panel header="Running Job Info">
        <JobListItem detailed job={this.state.runningJob}/>
      </Panel>
      log = <Panel header="Running Job Log">
        <Log job={this.state.runningJob} />
      </Panel>
    }

    return <div style={{height: "3000px"}}>
      {info}
      {log}
      <Panel header={"AWS Status " + status}>
        {table}
      </Panel>
    </div>
  }
}
