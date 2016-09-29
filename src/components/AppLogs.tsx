import * as React from "react";
import { Table, Panel } from "react-bootstrap";
import { appStore, Job, Jobs, timeSince, daysSince, JobStatus} from "../stores/Stores";
import { JobComponent } from "./Job";
import { JobLogComponent } from "./JobLog";

export class AppLogsComponent extends React.Component<void, void> {
  constructor() {
    super();
  }
  componentDidMount() {
    appStore.selectedJobs.onChange.attach(() => {
      this.forceUpdate();
    });
  }
  render() {
    console.debug("Rendering Logs");
    let logs = [];
    appStore.selectedJobs.jobs.forEach(job => {
      logs.push(<Panel key={job.id}>
        <JobComponent detailed job={job}/>
        <JobLogComponent job={job} />
      </Panel>);
    });
    return <div>
      {logs}
    </div>
  }
}
