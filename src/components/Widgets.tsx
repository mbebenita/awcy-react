import * as React from "react";
import { Button } from "react-bootstrap";
import { } from "react-bootstrap";
import { Jobs, Job, metricNames } from "../stores/Stores";
declare var require: any;
let Select = require('react-select');

interface JobSelectorProps {
  jobs: Job [];
  metrics: string [];
  onChange?: (jobs: Job [], metrics?: string [], videos?: string [], qualities?: number[]) => void;
}

export interface Option {
  label: string;
  value: string;
  disabled?: boolean;
}

function arraysEqual<T>(a: T [], b: T []): boolean {
  if (a == b) return true;
  if (a.length != b.length) return false;
  for (let i = 0; i < a.length; i++)
    if (a[i] != b[i]) return true;
  return false
}

export class JobSelector extends React.Component<JobSelectorProps, {
  availableJobs: Job [];
  jobs: Option [];
  videos: Option [];
  metrics: Option [];
  qualities: Option [];
}> {
  constructor() {
    super();
    this.state = {
      availableJobs: [],
      jobs: [],
      metrics: [],
      videos: [],
      qualities: []
    };
  }
  componentWillReceiveProps(nextProps: JobSelectorProps, nextContext: any) {
    if (!arraysEqual(this.state.availableJobs, nextProps.jobs)) {
      this.resetJobs(nextProps.jobs.slice(0));
    }
  }
  resetJobs(availableJobs: Job []) {
    let jobs = availableJobs.map(job => {
      return { value: job.id, label: job.id };
    });
    this.setState({availableJobs, jobs} as any);
  }
  componentWillMount() {
    this.resetJobs(this.props.jobs.slice(0));
    let metrics = this.props.metrics.map(metric => {
      return { value: metric, label: metric };
    });
    this.setState({metrics} as any);
  }
  getJob(id: string): Job {
    return this.props.jobs.find(job => job.id === id);
  }
  onChangeJob(index, option) {
    let jobs = this.state.jobs;
    jobs[index] = option;
    this.setState({jobs} as any, () => {
      this.onChange();
    });
  }
  onChange() {
    if (!this.props.onChange) {
      return;
    }
    this.props.onChange(
      this.state.jobs.map(job => job ? this.getJob(job.value) : null),
      this.state.metrics.map(option => option.value),
      this.state.videos.map(option => option.value),
      this.state.qualities.map(option => Number(option.value))
    );
  }
  onChangeMetrics(metrics) {
    this.setState({metrics} as any, () => {
      this.onChange();
    });
  }
  onChangeVideos(videos) {
    this.setState({videos} as any, () => {
      this.onChange();
    });
  }
  onChangeQualities(qualities) {
    this.setState({qualities} as any, () => {
      this.onChange();
    });
  }
  getJobAtIndex(index: number): Job {
    if (index < this.state.jobs.length && this.state.jobs[index]) {
      return this.getJob(this.state.jobs[index].value);
    }
    return null;
  }
  jobAtIndexIs(index: number, id: string): boolean {
    let job = this.getJobAtIndex(index);
    return job && job.id === id;
  }
  render() {
    console.debug("Rendering Job Selector");
    let allJobs = [];
    let allVideos = [];
    let metrics = metricNames.map(name => {
      return { value: name, label: name };
    });
    let jobs = this.props.jobs;
    let jobAOptions = jobs.map(job => {
      return { value: job.id, label: job.id, disabled: this.jobAtIndexIs(1, job.id) };
    });
    let jobBOptions = jobs.map(job => {
      return { value: job.id, label: job.id, disabled: this.jobAtIndexIs(0, job.id) };
    });
    let jobA = this.getJobAtIndex(0);
    let jobB = this.getJobAtIndex(1);
    let videos = (jobA && jobA.report) ? Object.keys(jobA.report).map(name => {
      return { value: name, label: name };
    }) : null;
    let qualities = (jobA && jobA.report) ? jobA.report["Total"].map(row => {
      return { value: row[0], label: row[0] };
    }) : null;
    return <div>
      <div className="row">
        <div className="col-xs-12">
          <div className="row">
            <div className="col-xs-6" style={{ paddingBottom: 8 }}>
              <div className="selectTitle">Compare</div>
              <Select name="jobA" value={this.state.jobs[0]} options={jobAOptions} onChange={this.onChangeJob.bind(this, 0)}/>
            </div>
            <div className="col-xs-6">
              <div className="selectTitle">With</div>
              <Select name="jobB" value={this.state.jobs[1]} options={jobBOptions} onChange={this.onChangeJob.bind(this, 1)}/>
            </div>
          </div>
          <div className="row">
            <div className="col-xs-4">
              <div className="selectTitle">Metrics</div>
              <Select multi value={this.state.metrics} options={metrics} onChange={this.onChangeMetrics.bind(this)}/>
            </div>
            <div className="col-xs-4">
              <div className="selectTitle">Videos</div>
              <Select multi value={this.state.videos} options={videos} onChange={this.onChangeVideos.bind(this)}/>
            </div>
            <div className="col-xs-4">
              <div className="selectTitle">Qualities</div>
              <Select multi value={this.state.qualities} options={qualities} onChange={this.onChangeQualities.bind(this)}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  }
}

interface AnalyzerProps {
  video: string;
  jobs: Job []
}
export class Analyzer extends React.Component<AnalyzerProps, {
  jobs: Job [];
  options: { value: string, label: string } [];
  selected: { value: string, label: string } [];
}> {
  constructor(props) {
    super();
    this.state = {
      jobs: [],
      options: [],
      selected: []
    } as any;
  }
  componentWillReceiveProps(nextProps: AnalyzerProps, nextContext: any) {
    if (!arraysEqual(this.state.jobs, nextProps.jobs)) {
      this.loadOptions(nextProps.jobs);
    }
  }
  loadOptions(jobs: Job []) {
    let video = this.props.video;
    let options = [];
    jobs.forEach((job) => {
      job.loadReport().then((report) => {
        if (!report) return;
        let options = this.state.options;
        report[video].forEach((row) => {
          options.push({ value: job.id + " " + row[0], label: job.id + " @ " + row[0] });
        })
        this.setState({options} as any);
      });
    });
  }
  componentWillMount() {
    this.loadOptions(this.props.jobs);
  }
  onChange(selected) {
    this.setState({selected} as any);
  }
  onAnalyzeClick() {

  }
  render() {
    let options = this.state.options;
    let selected = this.state.selected;
    return <div style={{ paddingBottom: 8, paddingTop: 4 }}>
      <div className="row">
        <div className="col-xs-6" style={{ paddingBottom: 8 }}>
          <Select multi placeholder="Analyzer Files" value={selected} options={options} onChange={this.onChange.bind(this)} />
        </div>
        <div className="col-xs-6" style={{ paddingBottom: 8 }}>
          <Button disabled={selected.length == 0} onClick={this.onAnalyzeClick.bind(this)}>Analyze Files</Button>
        </div>
      </div>
    </div>
  }
}