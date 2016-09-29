import * as React from "react";
import { Job } from "../stores/Stores";

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