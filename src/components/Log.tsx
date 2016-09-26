import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Table, Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";
import { Job, Jobs, AppStore, timeSince, daysSince} from "../stores/Stores";
import { JobListItemComponent } from "./Jobs";

export class JobLogComponent extends React.Component<{
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

export class AppStatusComponent extends React.Component<{
  store: AppStore
}, {
    runningJob: Job;
    aws: any;
  }> {
  constructor() {
    super();
    this.state = {
      runningJob: null
    } as any;
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
        <JobListItemComponent detailed job={this.state.runningJob}/>
      </Panel>
      log = <Panel header="Running Job Log">
        <JobLogComponent job={this.state.runningJob} />
      </Panel>
    }

    let store = this.props.store;
    let jobs = {};
    let totalJobCount = 0;
    store.jobs.jobs.forEach(job => {
      if (job.date && daysSince(job.date) > 14) {
        return;
      }
      if (!(job.nick in jobs)) {
        jobs[job.nick] = [];
      }
      jobs[job.nick].push(job);
      totalJobCount++;
    });

    let jobsByAuthor = [];
    for (let author in jobs) {
      jobsByAuthor.push(<Panel header={author + " " + jobs[author].length} key={author}>
        {jobs[author].map(job => {
          let date = job.date ? `${job.date.toLocaleDateString()} ${job.date.toLocaleTimeString()} (${timeSince(job.date)})`: "";
          return <div className="value" key={job.id}>{job.id}, {date}</div>
        })}
      </Panel>);
    }

    return <div style={{height: "3000px"}}>
      {info}
      {log}
      <Panel header={"AWS Status " + status}>
        {table}
      </Panel>
      <Panel header={totalJobCount + " Jobs (last 14 days)"}>
        {jobsByAuthor}
      </Panel>
    </div>
  }
}
