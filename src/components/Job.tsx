import * as React from "react";
import { Modal, Panel, Button, ProgressBar, ButtonToolbar, DropdownButton } from "react-bootstrap";
import { appStore, AppDispatcher, SelectJob, DeselectJob, CancelJob, SubmitJob, Jobs, Job, JobStatus, JobProgress, timeSince, minutesSince } from "../stores/Stores";

interface JobProps {
  job: Job;
  detailed?: boolean;
  onCancel?: (job: Job) => void;
}

export class JobComponent extends React.Component<JobProps, {
    job: Job,
    showCancelModal: boolean;
    hasReport: undefined | boolean;
    hasAnalyzer: undefined | boolean;
  }> {

  onChangeHandler: any;
  constructor(props: JobProps) {
    super();
    this.state = {
      job: props.job,
      showCancelModal: false,
      hasReport: undefined,
      hasAnalyzer: undefined
    };
    this.onChangeHandler = () => {
      this.forceUpdate();
    };
  }
  componentWillMount() {
    this.props.job.onChange.attach(this.onChangeHandler);
  }
  componentWillUnmount() {
    this.props.job.onChange.detach(this.onChangeHandler);
  }
  onCancelClick() {
    this.setState({ showCancelModal: true } as any);
  }
  onToggleSelectionClick() {
    let job = this.state.job;
    if (job.selected) {
      AppDispatcher.dispatch(new DeselectJob(this.state.job));
    } else {
      AppDispatcher.dispatch(new SelectJob(this.state.job));
    }
    // Check analyzer and report status.
    job.hasAnalyzer().then(result => {
      this.setState({hasAnalyzer: result} as any);
    });
    job.hasReport().then(result => {
      this.setState({hasReport: result} as any);
    });
  }
  abortCancel() {
    this.setState({ showCancelModal: false } as any);
  }
  confirmCancel() {
    this.abortCancel();
    this.props.onCancel(this.state.job);
  }
  render() {
    let job = this.props.job;
    let progress = null;
    if (job.status === JobStatus.Running) {
      let value = job.progress.total ? job.progress.value / job.progress.total : 0;
      let label = `${job.progress.value} of ${job.progress.total}`;
      let elapsed = minutesSince(job.date);
      let remaining = Math.round(elapsed / value - elapsed);
      label += " (" + remaining + "m left)";
      progress = <ProgressBar active now={100 * value} label={label} />
    } else if (job.status === JobStatus.Pending) {
      progress = <ProgressBar now={0} />
    }
    let details = null;
    let cancel = null;
    let select = null;
    if (job.status == JobStatus.Pending || job.status == JobStatus.Running) {
      if (this.props.onCancel) {
        cancel = <Button bsStyle="danger" disabled={!appStore.isLoggedIn} onClick={this.onCancelClick.bind(this)}>Cancel</Button>;
      }
    } else {
      select = <Button onClick={this.onToggleSelectionClick.bind(this)}>{job.selected ? "Deselect " + job.selectedName : "Select"}</Button>
    }
    let hasCompleted = null;
    if (!job.completed && job.status !== JobStatus.Running) {
      hasCompleted = <div className="jobWarning">Job failed.</div>
    }
    let hasAnalyzer = null;
    if (this.state.hasAnalyzer !== undefined) {
      if (this.state.hasAnalyzer === false) {
        hasAnalyzer = <div className="jobWarning">Analyzer failed to build.</div>
      }
    }
    let hasReport = null;
    if (this.state.hasReport !== undefined) {
      if (this.state.hasReport === false) {
        hasReport = <div className="jobWarning">Report failed to build or is not yet available.</div>
      }
    }
    let date = job.date ? `${job.date.toLocaleDateString()} ${job.date.toLocaleTimeString()} (${timeSince(job.date)})`: "";
    let borderRight = job.selected ? "4px solid " + job.color : undefined;
    let backgroundColor = (job.buildOptions === "" && job.extraOptions === "") ? "#FBFBFB": "";
    if (job.selected) {
      backgroundColor = "#F0F0F0";
    }
    let extra = [];
    if (job.buildOptions) extra.push("Build: " + job.buildOptions);
    if (job.extraOptions) extra.push("Extra: " + job.extraOptions);
    if (this.props.detailed) {
      extra.push("Qualities: " + job.qualities);
      extra.push("Run A/B Compare: " + job.runABCompare);
      extra.push("Save Encoded Files: " + job.saveEncodedFiles);
    }
    return <div className="list-group-item" style={{ borderRight, backgroundColor}}>
      <Modal show={this.state.showCancelModal} onHide={this.abortCancel.bind(this)}>
        <Modal.Header closeButton>
          <Modal.Title>Cancel job?</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h5>Are you sure you want to cancel {this.state.job.id}?</h5>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.confirmCancel.bind(this)}>Yes</Button>
          <Button onClick={this.abortCancel.bind(this)}>No</Button>
        </Modal.Footer>
      </Modal>
      {hasCompleted}
      {hasAnalyzer}
      {hasReport}
      {progress}
      <div className="jobValue">{job.id}</div>
      <div className="tinyJobValue">
        {job.nick}, {job.codec}, {job.commit}
      </div>
      <div className="tinyJobValue">
        {date}
      </div>
      <div className="tinyJobValue">
        {extra.join(", ")}
      </div>
      <ButtonToolbar style={{ paddingTop: 8 }}>
        {cancel}
        {select}
      </ButtonToolbar>
    </div>;
  }
}