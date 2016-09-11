import * as React from "react";
import { Table, ListGroup, ListGroupItem } from "react-bootstrap";
import { ButtonGroup, Radio, Grid, Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";

import { ScatterPlot, sortArray, ScatterPlotSeries, PlotAxis } from "./Plot";

import { Report, AppStore, Jobs, Job, JobStatus, loadXHR, ReportField, reportFieldNames, metricNames, metricNameToReportFieldIndex} from "../stores/Stores";
declare var google: any;

let Select = require('react-select');

function formatNumber(n) {
  return n.toLocaleString(); // .replace(/\.00$/, '');
}
function makeTableCell(key: any, v: number, color: boolean = false) {
  let className = "tableValue";
  if (color) {
    if (v > 0) {
      className = "positiveTableValue";
    } else if (v < 0) {
      className = "negativeTableValue";
    }
  }
  return <td key={key} className={className}>{formatNumber(v)}</td>
}

interface VideoReportProps {
  name?: string;
  job: Job;
  otherJob?: Job;
  highlightColumns?: string [];
  filterQualities?: number [];
}
export class VideoReport extends React.Component<VideoReportProps, {
  jobReport: Report;
  otherJobReport: Report;
}> {
  constructor() {
    super();
    this.state = {jobReport: null, otherJobReport: null};
  }
  componentWillReceiveProps(nextProps: VideoReportProps, nextContext: any) {
    if (this.props.job !== nextProps.job) {
      this.loadReport("jobReport", nextProps.job);
    }
    if (this.props.otherJob !== nextProps.otherJob) {
      this.loadReport("otherJobReport", nextProps.otherJob);
    }
  }
  loadReport(name: string, job: Job) {
    if (job) {
      job.loadReport().then((report) => {
        this.setState({[name]: report} as any);
      });
    } else {
      this.setState({[name]: null} as any);
    }
  }
  componentDidMount() {
    this.loadReport("jobReport", this.props.job);
    this.loadReport("otherJobReport", this.props.otherJob);
  }
  renderSummaryReport() {
    let jobReport = this.state.jobReport;
    let otherJobReport = this.state.otherJobReport;

    let headers = [<th key="video" className="tableHeader">Video</th>];
    headers = headers.concat(metricNames.map(name => <th key={name} className="tableHeader">{name}</th>));
    let rows = [];
    let filterQualities = this.props.filterQualities;
    function average(table: number [][], index: number) {
      let sum = 0;
      let counts = 0;
      for (let i = 0; i < table.length; i++) {
        let row = table[i];
        if (filterQualities.length &&
            filterQualities.indexOf(row[0]) < 0) {
          continue;
        }
        sum += table[i][index];
        counts++;
      }
      return sum / counts;
    }

    for (let key in jobReport) {
      let video = jobReport[key];
      let otherVideo = otherJobReport ? otherJobReport[key] : null;
      let cols = [<td key="key" className="tableValue">{key}</td>];
      metricNames.forEach((name, i) => {
        let value = average(video, 3 + i);
        if (otherVideo) {
          value -= average(otherVideo, 3 + i);
        }
        cols.push(makeTableCell(name, value, !!otherVideo));
      });
      rows.push(<tr key={key}>{cols}</tr>);
    }

    return <div key="summaryReport" style={{width: "1000px"}}>
      <div className="tableTitle">Summary</div>
      <Table striped bordered condensed hover style={{width: "100%"}}>
        <thead>
          <tr>
            {headers}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    </div>
  }
  render() {
    if (!this.props.name) {
      return this.renderSummaryReport();
    }
    let highlightColumns = this.props.highlightColumns;
    function tableHeaderClassName(name) {
      if (highlightColumns && highlightColumns.indexOf(name) >= 0) {
        return "highlightedTableHeader";
      }
      return "tableHeader";
    }
    let headers = reportFieldNames.map(name =>
      <th key={name} className={tableHeaderClassName(name)}>{name}</th>
    );

    let rows = [];
    let name = this.props.name;
    let jobVideoReport = this.state.jobReport ? this.state.jobReport[name] : null;
    let otherJobVideoReport = this.state.otherJobReport ? this.state.otherJobReport[name] : null;
    if (!jobVideoReport) {
      jobVideoReport = otherJobVideoReport;
      otherJobVideoReport = null;
    }
    if (!jobVideoReport) {
      return null;
    }
    jobVideoReport.forEach(row => {
      if (this.props.filterQualities.length &&
          this.props.filterQualities.indexOf(row[0]) < 0) {
        return;
      }
      let cols = null;
      if (otherJobVideoReport) {
        let otherRow = otherJobVideoReport.find((otherRow => otherRow[0] === row[0]));
        cols = row.map((v, i) => {
          return makeTableCell(i, i > 1 ? v - otherRow[i] : v, i > 1);
        });
      } else {
        cols = row.map((v, i) => {
          return <td key={i} className="tableValue">{formatNumber(v)}</td>
        });
      }
      rows.push(<tr key={row[0]}>{cols}</tr>);
    })

    let table = <div>
      <Table striped bordered condensed hover style={{width: "100%"}}>
        <thead>
          <tr>
            {headers}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    </div>
    return table;
  }
}

export class FullReport extends React.Component<{
  jobs: Jobs;
}, {
  selectedJobs: Job [],
  video: string,
  quality: string
  metric: string,
}> {
  constructor() {
    super();
    this.state = {selectedJobs: [], video: "", quality: "", metric: "MSSSIM"};
  }
  componentWillMount() {
    this.props.jobs.onChange.attach(name => {
      this.load();
    });
    this.load();
  }
  load() {
    Promise.all(this.props.jobs.jobs.map(job => {
      return job.loadReport();
    })).then(data => {
      let selectedJobs = this.props.jobs.jobs.slice(0, 2);
      this.setState({selectedJobs} as any);
    });
  }
  onChangeJob(i: number, e: any): any {
    let selectedJobs = this.state.selectedJobs;
    selectedJobs[i] = this.props.jobs.getById(e.target.value);
    this.setState({selectedJobs} as any);
  }
  onChangeVideo(e: any): any {
    let video = e.target.value;
    this.setState({video} as any);
  }
  onChangeQuality(e: any): any {
    let quality = e.target.value;
    this.setState({quality} as any);
  }
  onChangeMetric(e: any): any {
    let metric = e.target.value;
    this.setState({metric} as any);
  }
  renderSummaryReport(job: Job, otherJob: Job) {
    let headers = [<th key="video" className="tableHeader">Video</th>];
    headers = headers.concat(metricNames.map(name => <th key={name} className="tableHeader">{name}</th>));
    let rows = [];
    let qualityFilter = this.state.quality == "" ? -1 : Number(this.state.quality);
    function average(table: number [][], index: number) {
      let sum = 0;
      let counts = 0;
      for (let i = 0; i < table.length; i++) {
        let row = table[i];
        if (row[0] != qualityFilter && qualityFilter >= 0) {
          continue;
        }
        sum += table[i][index];
        counts++;
      }
      return sum / counts;
    }

    for (let key in job.report) {
      let video = job.report[key];
      let otherVideo = otherJob.report[key];
      let cols = [<td key="key" className="tableValue">{key}</td>];
      metricNames.forEach((name, i) => {
        let value = average(video, 3 + i) - average(otherVideo, 3 + i);
        cols.push(makeTableCell(name, value, true));
      });
      rows.push(<tr key={key}>{cols}</tr>);
    }

    return <div key="summaryReport" style={{width: "1000"}}>
      <div className="tableTitle">Summary</div>
      <Table striped bordered condensed hover style={{width: "100%"}}>
        <thead>
          <tr>
            {headers}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>
    </div>
  }
  render() {
    let jobs = this.state.selectedJobs;

    if (jobs.length == 0) {
      return <div>No jobs selected.</div>;
    }

    let job = jobs[0];
    let otherJob = jobs[1];

    let tables = [];

    if (otherJob) {
      tables.push(this.renderSummaryReport(job, otherJob));
    }

    for (let key in job.report) {
      if (key != this.state.video && this.state.video != "") {
        continue;
      }
      let video = job.report[key];
      let otherVideo = otherJob ? otherJob.report[key] : null;
      let rows = [];
      video.forEach(row => {
        if (String(row[0]) != this.state.quality && this.state.quality != "") {
          return;
        }
        let cols = null;
        if (otherVideo) {
          let otherRow = null;
          for (let j = 0; j < otherVideo.length; j++) {
            if (otherVideo[j][0] == row[0]) {
              otherRow = otherVideo[j];
              break;
            }
          }
          cols = row.map((v, i) => {
            return makeTableCell(i, i > 1 ? v - otherRow[i] : v, i > 1);
          });
        } else {
          cols = row.map((v, i) => {
            return <td key={i} className="tableValue">{formatNumber(v)}</td>
          });
        }
        rows.push(<tr key={row[0]}>{cols}</tr>);
      })
      let headers = reportFieldNames.map(name => <th key={name} className="tableHeader">{name}</th>);

      tables.push(<div key={key} style={{width: "1000px"}}>
        <div className="tableTitle">{key}</div>
        <Table striped bordered condensed hover style={{width: "100%"}}>
          <thead>
            <tr>
              {headers}
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
      </div>);
    }

    let allJobs = this.props.jobs.jobs.map(job => {
      return <option key={job.id} value={job.id}>{job.id}</option>
    });

    let allMetrics = [];
    metricNames.forEach(name => {
      allMetrics.push(<option key={name} value={name}>{name}</option>);
    });

    let allNames = [<option key="All" value="">All</option>];
    Object.keys(job.report).forEach(name => {
      allNames.push(<option key={name} value={name}>{name}</option>);
    });

    let allQualities = [<option key="All" value="">All</option>];
    job.report["Total"].forEach(row => {
      let q = row[0];
      allQualities.push(<option key={q} value={q}>{q}</option>);
    });

    let toolbar = <div style={{width: "1000"}}>
      <FormGroup bsSize="small">
        <div className="row">
          <div className="col-xs-12">
            <div className="row">
              <div className="col-xs-6" style={{paddingBottom: 8}}>
                <div className="selectTitle">Compare</div>
                  <FormControl componentClass="select"
                              placeholder="select"
                              value={this.state.selectedJobs[0] ? this.state.selectedJobs[0].id : "Select Job"}
                              onChange={this.onChangeJob.bind(this, 0)}>
                    { allJobs }
                  </FormControl>
              </div>
              <div className="col-xs-6">
                <div className="selectTitle">With</div>
                <FormControl componentClass="select"
                            value={this.state.selectedJobs[1] ? this.state.selectedJobs[1].id : "Select Job"}
                            onChange={this.onChangeJob.bind(this, 1)}>
                  { allJobs }
                </FormControl>
              </div>
            </div>
            <div className="row">
            <div className="col-xs-4">
                <div className="selectTitle">Chart Metric</div>
                <FormControl componentClass="select"
                             placeholder="select"
                             value={this.state.metric}
                             onChange={this.onChangeMetric.bind(this)}>
                  { allMetrics }
                </FormControl>
              </div>
              <div className="col-xs-4">
                <div className="selectTitle">Video</div>
                <FormControl componentClass="select"
                             placeholder="select"
                             value={this.state.video}
                             onChange={this.onChangeVideo.bind(this)}>
                  { allNames }
                </FormControl>
              </div>
              <div className="col-xs-4">
                <div className="selectTitle">Quality</div>
                <FormControl componentClass="select"
                             value={this.state.quality}
                             onChange={this.onChangeQuality.bind(this)}>
                  { allQualities }
                </FormControl>
              </div>
            </div>
          </div>
        </div>
      </FormGroup>
    </div>
    return <div>
      {toolbar}
      {tables}
    </div>;
  }
}