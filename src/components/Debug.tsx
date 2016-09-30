import * as React from "react";
import { Button, Table, Panel } from "react-bootstrap";
import { AppDispatcher, CancelJob, SubmitJob, SelectJob, DeselectJob, appStore, Job, Jobs, timeSince, daysSince, JobStatus} from "../stores/Stores";
import { JobComponent } from "./Job";
import { JobLogComponent } from "./JobLog";

export class DebugComponent extends React.Component<void, void> {
  constructor() {
    super();
  }
  getRandomJob(filter: JobStatus) {
    let jobs = appStore.jobs.jobs;
    let count = 0;
    while (true) {
      let job = jobs[Math.random() * jobs.length | 0];
      if ((job.status & filter) === job.status) {
        return job;
      }
      count ++;
      if (count > 100) {
        return null;
      }
    }
  }
  onSubmitJobClick() {
    let job = new Job();
    job.id = "JOB:" + Math.random();
    job.date = new Date();
    AppDispatcher.dispatch(new SubmitJob(job));
  }
  onCancelJobClick() {
    let job = this.getRandomJob(JobStatus.Completed);
    if (job) AppDispatcher.dispatch(new CancelJob(job));
  }
  onSelectJobClick() {
    let job = this.getRandomJob(JobStatus.Completed);
    if (job) AppDispatcher.dispatch(new SelectJob(job));
  }
  onPollClick() {
    appStore.poll();
  }
  render() {
    console.debug("Rendering Debug");
    return <Panel>
      <Button onClick={this.onSubmitJobClick.bind(this)}>Submit Random Job</Button>{' '}
      <Button onClick={this.onCancelJobClick.bind(this)}>Cancel Random Job</Button>{' '}
      <Button onClick={this.onSelectJobClick.bind(this)}>Select Random Job</Button>{' '}
      <Button onClick={this.onPollClick.bind(this)}>Poll Server</Button>
    </Panel>
  }
}
