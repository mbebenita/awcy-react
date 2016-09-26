import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";
import { AppDispatcher, Action, SelectJob, DeselectJob, CancelJob, SubmitJob , AppStore, Jobs, Job, JobStatus, JobProgress } from "../stores/Stores";
import { Option } from "./Widgets"
declare var require: any;
let Select = require('react-select');

declare var tinycolor: any;

interface JobListItemProps {
  job: Job;
  detailed?: boolean;
  onCancel?: (job: Job) => void;
}

export class JobListItemComponent extends React.Component<JobListItemProps, {
    job: Job,
    progress: JobProgress;
    showCancelModal: boolean;
    hasReport: undefined | boolean;
    hasAnalyzer: undefined | boolean;
  }> {
  constructor(props: JobListItemProps) {
    super();
    this.state = {
      job: props.job,
      progress: new JobProgress(0, 0),
      showCancelModal: false,
      hasReport: undefined,
      hasAnalyzer: undefined
    };
  }
  componentWillMount() {
    let job = this.props.job;
    job.onChange.attach(() => {
      this.setState({ job, progress: job.progress } as any);
    });
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
    function timeSince(date: Date) {
      var oneSecond = 1000;
      var oneMinute = 60 * oneSecond;
      var oneHour = 60 * oneMinute;
      var oneDay = 24 * oneHour;
      let diff = new Date().getTime() - date.getTime();
      var days = Math.round(Math.abs(diff / oneDay));
      var hours = Math.round(Math.abs(diff % oneDay) / oneHour);
      let s = "";
      if (days > 0) {
        s += `${days} days, `
      }
      return s + `${hours} hour${hours === 1 ? "" : "s"} ago`;
    }
    let job = this.props.job;
    // let color = job.color ? tinycolor(job.color).desaturate().toString() : "";
    let progress = null;
    let jobProgress = this.state.progress;
    if (job.status === JobStatus.Running) {
      let value = jobProgress.total ? jobProgress.value / jobProgress.total : 0;
      progress = <ProgressBar active now={100 * value} label={`${jobProgress.value} of ${jobProgress.total}`} />
    } else if (job.status === JobStatus.Pending) {
      progress = <ProgressBar now={0} />
    }
    let details = null;
    if (this.props.detailed) {
      details = [
        <div key="0" className="keyValuePair"><span className="key">Build Options</span>: <span className="value">{job.buildOptions}</span></div>,
        <div key="1" className="keyValuePair"><span className="key">Extra Options</span>: <span className="value">{job.extraOptions}</span></div>,
        <div key="2" className="keyValuePair"><span className="key">Nick</span>: <span className="value">{job.nick}</span></div>,
        <div key="3" className="keyValuePair"><span className="key">Qualities</span>: <span className="value">{job.qualities}</span></div>,
        <div key="4" className="keyValuePair"><span className="key">Task</span>: <span className="value">{job.task}</span></div>,
        <div key="5" className="keyValuePair"><span className="key">Task Type</span>: <span className="value">{job.taskType}</span></div>,
        <div key="6" className="keyValuePair"><span className="key">Run A/B Compare</span>: <span className="value">{String(job.runABCompare)}</span></div>,
        <div key="7" className="keyValuePair"><span className="key">Save Encoded Files</span>: <span className="value">{String(job.saveEncodedFiles)}</span></div>
      ];
    }
    let cancel = null;
    let select = null;
    if (job.status == JobStatus.Pending || job.status == JobStatus.Running) {
      if (this.props.onCancel) {
        cancel = <Button bsStyle="danger" onClick={this.onCancelClick.bind(this)}>Cancel</Button>;
      }
    } else {
      select = <Button onClick={this.onToggleSelectionClick.bind(this)}>{job.selected ? "Deselect " + job.selectedName : "Select"}</Button>
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
    let backgroundColor = (job.buildOptions === "" && job.extraOptions === "") ? "#D3E7ED": "";
    if (job.selected) {
      backgroundColor = "#F0F0F0";
    }
    let options = [];
    if (job.buildOptions) options.push("Build: " + job.buildOptions);
    if (job.extraOptions) options.push("Extra: " + job.extraOptions);
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
        {options.join(", ")}
      </div>
      {details}
      <ButtonToolbar style={{ paddingTop: 8 }}>
        {cancel}
        {select}
      </ButtonToolbar>
    </div>;
  }
}

export class SubmitJobFormComponent extends React.Component<{
  onCreate: (job: Job) => void;
  onCancel: () => void;
}, {
    job: Job;
    set: Option;
    codec: Option;
  }> {
  constructor() {
    super();
    this.state = {
      job: null,
      set: null,
      codec: null
    };
  }
  componentWillMount() {
    this.setState({ job: new Job() } as any);
  }
  getValidationState(name?: string): "success" | "warning" | "error" {
    let job = this.state.job;
    switch (name) {
      case "all":
        return ["id", "commit", "codec", "set", "nick", "qualities"].every(name =>
          (this.getValidationState(name) === "success")
        ) ? "success" : "error";
      case "id":
        if (job.id) {
          return "success";
        }
        break;
      case "commit":
        let commit = job.commit.toLowerCase().trim();
        if (commit.length == 40) {
          for (let i = 0; i < commit.length; i++) {
            if ("abcdef0123456789".indexOf(commit[i]) < 0) {
              return "error";
            }
          }
          return "success";
        }
        break;
      case "codec":
        if (this.state.codec) return "success";
        break;
      case "set":
        if (this.state.set) return "success";
        break;
      case "nick":
        if (job.nick) return "success";
        break;
      case "qualities":
        if (job.qualities.length === 0) {
          return "success";
        } else {
          if (job.qualities.split(" ").every((quality, index, array) => {
            let v = Number(quality);
            return (v | 0) === v;
          })) {
            return "success";
          }
        }
        break;
    }
    return "error";
  }
  onInputChange(key: string, e: any) {
    let job = this.state.job;
    if (e.target.type === "checkbox") {
      job[key] = e.target.checked;
    } else {
      job[key] = e.target.value;
    }
    this.setState({ job } as any);
  }
  onCreate() {
    let job = this.state.job;
    job.task = this.state.set.value;
    job.codec = this.state.codec.value;
    this.props.onCreate(job);
  }
  onCancel() {
    this.props.onCancel();
  }
  onChangeCodec(codec: Option) {
    this.setState({ codec } as any, () => { });
  }

  onChangeSet(set: Option) {
    this.setState({ set } as any, () => { });
  }

  onChangeAuthor(author: Option) {
    this.setState({ author } as any, () => { });
  }

  onChangeConfigs(configs: Option) {
    this.setState({ configs } as any, () => { });
  }
  render() {
    let job = this.state.job;

    let codecOptions = [];
    for (let key in Job.codecs) {
      let name = Job.codecs[key];
      codecOptions.push({ value: key, label: name });
    }

    let setOptions = [];
    for (let key in Job.sets) {
      let set = Job.sets[key];
      setOptions.push({ value: key, label: key });
    }

    return <Form>
      <FormGroup validationState={this.getValidationState("id")}>
        <ControlLabel>ID</ControlLabel>
        <FormControl type="text" placeholder=""
          value={job.id} onChange={this.onInputChange.bind(this, "id")} />
      </FormGroup>

      <FormGroup validationState={this.getValidationState("commit")}>
        <ControlLabel>Git Commit Hash</ControlLabel>
        <FormControl type="text" placeholder="e.g. 9368c05596d517c280146a1b815ec0ecc25e787c"
          value={job.commit} onChange={this.onInputChange.bind(this, "commit")} />
      </FormGroup>

      <FormGroup validationState={this.getValidationState("codec")}>
        <ControlLabel>Codec</ControlLabel>
        <Select placeholder="Codec" value={this.state.codec} options={codecOptions} onChange={this.onChangeCodec.bind(this)} />
      </FormGroup>

      <FormGroup validationState={this.getValidationState("set")}>
        <ControlLabel>Set</ControlLabel>
        <Select placeholder="Set" value={this.state.set} options={setOptions} onChange={this.onChangeSet.bind(this)} />
      </FormGroup>

      <FormGroup>
        <ControlLabel>Extra CLI Options</ControlLabel>
        <FormControl type="text"
          value={job.extraOptions} onChange={this.onInputChange.bind(this, "extraOptions")} />
      </FormGroup>

      <FormGroup>
        <ControlLabel>Extra Build Options</ControlLabel>
        <FormControl type="text"
          value={job.buildOptions} onChange={this.onInputChange.bind(this, "buildOptions")} />
      </FormGroup>

      <FormGroup validationState={this.getValidationState("nick")}>
        <ControlLabel>Your IRC nick (for auto-notifications on #daala)</ControlLabel>
        <FormControl type="text"
          value={job.nick} onChange={this.onInputChange.bind(this, "nick")} />
      </FormGroup>

      <FormGroup validationState={this.getValidationState("qualities")}>
        <ControlLabel>Custom Qualities</ControlLabel>
        <FormControl type="text" placeholder="30 40 50 ..."
          value={job.qualities} onChange={this.onInputChange.bind(this, "qualities")} />
      </FormGroup>

      <FormGroup>
        <ButtonToolbar>
          <Button disabled={this.getValidationState("all") === "error"} bsStyle="success" onClick={this.onCreate.bind(this)}>Submit</Button>
          <Button bsStyle="danger" onClick={this.onCancel.bind(this)}>Cancel</Button>
        </ButtonToolbar>
      </FormGroup>
    </Form>
  }
}

interface JobListProps {
  store: Jobs;
  jobStatusFilter?: JobStatus;
  detailed?: boolean;
  listHeight: number
}

export class JobListComponent extends React.Component<JobListProps, {
    jobs: Job[];
    jobStatusFilter: JobStatus;
    showSubmitJobForm: boolean;
    set: Option;
    codec: Option;
    author: Option;
    configs: Option[];
  }> {
  constructor(props: JobListProps) {
    super();
    this.state = {
      jobs: [],
      jobStatusFilter: props.jobStatusFilter,
      showSubmitJobForm: false,
    } as any;
  }

  componentDidMount() {
    this.props.store.onChange.attach(() => {
      this.setState({ jobs: this.props.store.jobs } as any);
    });
  }

  onChangeCodec(codec: Option) {
    this.setState({ codec } as any, () => { });
  }

  onChangeSet(set: Option) {
    this.setState({ set } as any, () => { });
  }

  onChangeAuthor(author: Option) {
    this.setState({ author } as any, () => { });
  }

  onChangeConfigs(configs: Option) {
    this.setState({ configs } as any, () => { });
  }

  onCancelJob(job: Job) {
    AppDispatcher.dispatch(new CancelJob(job));
  }

  onSubmitNewJobClick() {
    this.setState({ showSubmitJobForm: true } as any);
  }

  makeJobList() {
    let jobs = this.state.jobs;

    let codecOptions = [];
    for (let key in Job.codecs) {
      let name = Job.codecs[key];
      codecOptions.push({ value: key, label: name });
    }

    let setOptions = [];
    for (let key in Job.sets) {
      let set = Job.sets[key];
      setOptions.push({ value: key, label: key });
    }

    let authorOptions = [];
    let configOptions = [];
    let uniqueAuthors = [];
    let uniqueBuildsFlags = [];
    jobs.forEach(job => {
      if (uniqueAuthors.indexOf(job.nick) < 0) {
        uniqueAuthors.push(job.nick);
      }
      let flags = job.buildOptions.trim().split(" ");
      flags.forEach(flag => {
        if (flag && uniqueBuildsFlags.indexOf(flag) < 0) {
          uniqueBuildsFlags.push(flag);
        }
      })
    });
    configOptions = uniqueBuildsFlags.map(option => {
      return { value: option, label: option };
    });
    authorOptions = uniqueAuthors.map(author => {
      return { value: author, label: author };
    });
    return <div>
      <div style={{ width: "100%", paddingBottom: "10px" }}>
        <Button bsStyle="success" onClick={this.onSubmitNewJobClick.bind(this)}>Submit New Job</Button>
      </div>
      <div style={{ display: "table", width: "100%" }}>
        <div style={{ display: "table-row" }}>
          <div style={{ display: "table-cell", paddingRight: "5px" }}>
            <Select placeholder="Codec" value={this.state.codec} options={codecOptions} onChange={this.onChangeCodec.bind(this)} />
          </div>
          <div style={{ display: "table-cell", paddingLeft: "5px", paddingRight: "5px" }}>
            <Select placeholder="Set" value={this.state.set} options={setOptions} onChange={this.onChangeSet.bind(this)} />
          </div>
          <div style={{ display: "table-cell", paddingLeft: "5px" }}>
            <Select placeholder="Author" value={this.state.author} options={authorOptions} onChange={this.onChangeAuthor.bind(this)} />
          </div>
        </div>
      </div>
      <div style={{ width: "100%", paddingTop: "10px", paddingBottom: "10px" }}>
        <Select multi placeholder="Config" value={this.state.configs} options={configOptions} onChange={this.onChangeConfigs.bind(this)} />
      </div>
      <div style={{bottom: 0, height: this.props.listHeight, overflow: "scroll", overflowX: "hidden"}}>
        <ListGroup componentClass="ul">
          {jobs.filter((job: Job) => {
            if (!(job.status & this.state.jobStatusFilter)) {
              return false;
            }
            if (this.state.author && job.nick != this.state.author.value) {
              return false;
            }
            if (this.state.set && job.task != this.state.set.value) {
              return false;
            }
            if (this.state.codec && job.codec != this.state.codec.value) {
              return false;
            }
            if (this.state.configs) {
              if (!this.state.configs.every(option => job.buildOptions.indexOf(option.value) >= 0)) {
                return false;
              }
            }
            return true;
          }).map((job: Job) => {
            return <JobListItemComponent detailed={this.props.detailed} key={job.id} job={job} onCancel={this.onCancelJob.bind(this)}></JobListItemComponent>
          })}
        </ListGroup>
      </div>
    </div>
  }

  hideSubmitJobForm() {
    this.setState({ showSubmitJobForm: false } as any);
  }
  onSubmitJob(job: Job) {
    this.hideSubmitJobForm();
    AppDispatcher.dispatch(new SubmitJob(job));
  }
  render() {
    console.debug("Rendering Job List");
    if (this.state.showSubmitJobForm) {
      return <SubmitJobFormComponent onCreate={this.onSubmitJob.bind(this)} onCancel={this.hideSubmitJobForm.bind(this)} />
    } else {
      return this.makeJobList();
    }
  }
}


