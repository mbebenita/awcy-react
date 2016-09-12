import * as React from "react";
import { AppDispatcher, Action, SelectJob, DeselectJob } from "../dispatchers/Dispatcher"
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";

import { AppStore, Jobs, Job, JobStatus, JobProgress } from "../stores/Stores";
import { Option } from "./Widgets"

declare var tinycolor: any;
let Select = require('react-select');

export class JobListItem extends React.Component<{
  job: Job;
  detailed?: boolean;
}, {
    job: Job,
    progress: JobProgress;
    showCancelModal: boolean;
  }> {
  componentWillMount() {
    let job = this.props.job;
    this.state = {
      job,
      progress: new JobProgress(0, 0),
      showCancelModal: false
    };
    job.onChange.attach(() => {
      this.setState({ job, progress: job.progress } as any);
    });
  }
  onCancelClick() {
    this.setState({showCancelModal: true} as any);
  }
  onToggleSelectionClick() {
    let job = this.state.job;
    if (job.selected) {
      AppDispatcher.dispatch(new DeselectJob(this.state.job));
    } else {
      AppDispatcher.dispatch(new SelectJob(this.state.job));
    }
  }
  abortCancel() {
    this.setState({showCancelModal: false} as any);
  }
  confirmCancel() {
    this.abortCancel();
  }
  render() {
    if (this.state.showCancelModal) {
      return <Modal show={true} onHide={this.abortCancel.bind(this)}>
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
    }
    let job = this.props.job;
    let color = job.color ? tinycolor(job.color).desaturate().toString() : "";
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
      cancel = <Button bsStyle="danger" onClick={this.onCancelClick.bind(this)}>Cancel</Button>;
    } else {
      select = <Button onClick={this.onToggleSelectionClick.bind(this)}>{job.selected ? "Deselect" : "Select"}</Button>
    }
    return <div className="list-group-item" style={{ backgroundColor: color }}>
      {progress}
      <div className="keyValuePair"><span className="key">ID</span>: <span className="value">{job.id}</span></div>
      <div className="keyValuePair"><span className="key">Codec</span>: <span className="value">{job.codec}</span></div>
      <div className="keyValuePair"><span className="key">Commit</span>: <span className="value">{job.commit}</span></div>
      {details}
      <ButtonToolbar style={{ paddingTop: 8 }}>
        {cancel}
        {select}
      </ButtonToolbar>
    </div>;
  }
}


export interface JobsProps {
  store: Jobs;
  jobStatusFilter?: JobStatus;
  onSelectChanged?: (job: Job) => void;
  detailed?: boolean;
}

export interface JobsState {
  jobs: Job[];
  jobStatusFilter: JobStatus;
  showCreateJobForm: boolean;
  jobToCreate: Job;
  codec: Option;
  set: Option;
  author: Option;
  configs: Option[];
}


export class JobList extends React.Component<JobsProps, JobsState> {
  constructor() {
    super();
    this.state = {
      jobs: [],
      jobStatusFilter: JobStatus.All,
      showCreateJobForm: false,
      jobToCreate: null
    };
  }

  componentDidMount() {
    this.props.store.onChange.attach(() => {
      this.setState({ jobs: this.props.store.jobs } as any);
    });
    if (this.props.jobStatusFilter !== undefined) {
      this.setState({jobStatusFilter: this.props.jobStatusFilter} as any);
    }
  }

  onViewLogClick() {

  }

  onSelectChanged(job: Job) {
    this.props.onSelectChanged(job);
  }

  createNewJob() {
    this.props.store.addJob(this.state.jobToCreate);
    this.hideCreateNewJobForm();
  }

  showJobCreateForm() {
    let job = new Job();
    job.codec = "av1";
    job.task = "objective-1-fast";
    this.setState({ showCreateJobForm: true, jobToCreate: job } as any);
  }

  hideCreateNewJobForm() {
    this.setState({ showCreateJobForm: false, jobToCreate: null } as any);
  }

  onJobToCreateChange(key: string, e: any) {
    let job = this.state.jobToCreate;
    if (e.target.type === "checkbox") {
      job[key] = e.target.checked;
    } else {
      job[key] = e.target.value;
    }
    this.setState({ jobToCreate: job } as any);
  }

  getValidationState(key: string): "error" | "success" {
    let job = this.state.jobToCreate;
    switch (key) {
      case "id":
        if (job.id.length === 0) {
          return "error";
        }
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
        return "error";
    }
    return "success";
  }

  jobCreateFormEl() {
    let codecOptions = [];
    for (let key in Job.codecs) {
      codecOptions.push(<option key={key} value={key}>{Job.codecs[key]}</option>);
    }

    let setOptions = [];
    for (let key in Job.sets) {
      setOptions.push(<option key={key} value={key}>{key}</option>);
    }

    const qualitiesPopover = (
      <Popover id="qualitiesPopover" title="QP Values">
        You many optionally specify a list of QP values, separted by space.
      </Popover>
    );

    let job = this.state.jobToCreate;
    return <Form>
      <FormGroup validationState={this.getValidationState("id")}>
        <ControlLabel>ID</ControlLabel>
        <FormControl type="text" placeholder=""
          value={job.id} onChange={this.onJobToCreateChange.bind(this, "id")} />
        <FormControl.Feedback />
      </FormGroup>
      <FormGroup>
        <ControlLabel>Git Commit Hash</ControlLabel>
        <FormControl type="text" placeholder="e.g. 9368c05596d517c280146a1b815ec0ecc25e787c"
          value={job.commit} onChange={this.onJobToCreateChange.bind(this, "commit")} />
      </FormGroup>
      <FormGroup>
        <ControlLabel>Codec</ControlLabel>
        <FormControl componentClass="select" placeholder="select"
          value={job.codec} onChange={this.onJobToCreateChange.bind(this, "codec")}>
          {codecOptions}
        </FormControl>
      </FormGroup>
      <FormGroup>
        <ControlLabel>Subset</ControlLabel>
        <FormControl componentClass="select" placeholder="select"
          value={job.task} onChange={this.onJobToCreateChange.bind(this, "task")}>
          {setOptions}
        </FormControl>
      </FormGroup>
      <FormGroup>
        <ControlLabel>Extra CLI Options</ControlLabel>
        <FormControl type="text"
          value={job.extraOptions} onChange={this.onJobToCreateChange.bind(this, "extraOptions")} />
      </FormGroup>
      <FormGroup>
        <ControlLabel>Extra Build Options</ControlLabel>
        <FormControl type="text"
          value={job.buildOptions} onChange={this.onJobToCreateChange.bind(this, "buildOptions")} />
      </FormGroup>
      <FormGroup validationState={this.getValidationState("qualities")}>
        <ControlLabel>Custom Qualities</ControlLabel>
        <OverlayTrigger trigger={['hover', 'focus']} placement="bottom" overlay={qualitiesPopover}>
          <FormControl type="text" placeholder="30 40 50 ..."
            value={job.qualities} onChange={this.onJobToCreateChange.bind(this, "qualities")} />
        </OverlayTrigger>
        <FormControl.Feedback />
      </FormGroup>
      <FormGroup>
        <ControlLabel>Your IRC nick (for auto-notifications on #daala)</ControlLabel>
        <FormControl type="text"
          value={job.nick} onChange={this.onJobToCreateChange.bind(this, "nick")} />
      </FormGroup>
      <FormGroup>
        <Checkbox inline checked={job.runABCompare} onChange={this.onJobToCreateChange.bind(this, "runABCompare")}>
          Run AB Compare
        </Checkbox>
        {' '}
        <Checkbox inline checked={job.saveEncodedFiles} onChange={this.onJobToCreateChange.bind(this, "saveEncodedFiles")}>
          Save Encoded Files (.ivf)
        </Checkbox>
      </FormGroup>
      <FormGroup>
        <ButtonToolbar>
          <Button bsStyle="success" onClick={this.createNewJob.bind(this)}>Submit</Button>
          <Button bsStyle="danger" onClick={this.hideCreateNewJobForm.bind(this)}>Cancel</Button>
        </ButtonToolbar>
      </FormGroup>
    </Form>
  }

  onChangeCodec(codec: Option) {
    this.setState({ codec } as any, () => {
    });
  }

  onChangeSet(set: Option) {
    this.setState({ set } as any, () => {
    });
  }

  onChangeAuthor(author: Option) {
    this.setState({ author } as any, () => {
    });
  }

  onChangeConfigs(configs: Option) {
    this.setState({ configs } as any, () => {
    });
  }

  jobListEl() {
    // <Button bsStyle="danger" onClick={this.cancelAllJobs.bind(this)}>Delete All Jobs</Button>
    // <Button bsStyle="success" onClick={this.showJobCreateForm.bind(this)}>Submit New Job</Button>
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

      <div style={{ height: "600px", overflow: "scroll" }}>
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
            return <JobListItem detailed={this.props.detailed} key={job.id} job={job}></JobListItem>
          })}
        </ListGroup>
      </div>
    </div>
  }

  render() {
    if (this.state.showCreateJobForm) {
      return this.jobCreateFormEl()
    } else {
      return this.jobListEl();
    }
  }
}
