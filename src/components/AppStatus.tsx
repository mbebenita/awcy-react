import * as React from "react";
import { Table, Panel } from "react-bootstrap";
import { appStore, Job, Jobs, timeSince, daysSince, JobStatus} from "../stores/Stores";
import { JobListItemComponent } from "./Jobs";
import { JobLogComponent } from "./JobLog";

export class AppStatusComponent extends React.Component<void, {
    aws: any;
  }> {
  constructor() {
    super();
    this.state = {} as any;
  }
  componentDidMount() {
    appStore.onAWSChange.attach(() => {
      this.setState({
        aws: appStore.aws
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

    let jobInfos = [];
    appStore.jobs.jobs.forEach(job => {
      if (job.status === JobStatus.Running) {
        jobInfos.push(<Panel key={job.id}>
          <JobListItemComponent detailed job={job}/>
          <JobLogComponent job={job} />
        </Panel>);
      }
    });

    let jobs = {};
    let totalJobCount = 0;
    appStore.jobs.jobs.forEach(job => {
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
      let awards = [];
      if (author === "codeview") {
        for (let i = 0; i < jobs[author].length; i++) {
          let src = ["img/bottle.png", "img/mug.png", "img/beer.png"][Math.random() * 3 | 0];
          awards.push(<img key={i} src={src} style={{height: 32, padding: 2}}/>);
        }
      }
      jobsByAuthor.push(<Panel header={author + " " + jobs[author].length} key={author}>
        {awards}
        {jobs[author].map(job => {
          let date = job.date ? `${job.date.toLocaleDateString()} ${job.date.toLocaleTimeString()} (${timeSince(job.date)})`: "";
          return <div className="value" key={job.id}>{job.id}, {date}</div>
        })}
      </Panel>);
    }
    return <div style={{height: "3000px"}}>
      {jobInfos}
      <Panel header={"AWS Status " + status}>
        {table}
      </Panel>
      <Panel header={totalJobCount + " Jobs (last 14 days)"}>
        {jobsByAuthor}
      </Panel>
    </div>
  }
}
