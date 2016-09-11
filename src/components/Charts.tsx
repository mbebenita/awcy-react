import * as React from "react";
import { Table, ListGroup, ListGroupItem } from "react-bootstrap";
import { Jumbotron, Grid, Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";

import { ScatterPlot, sortArray, ScatterPlotSeries, PlotAxis } from "./Plot";
import { VideoReport } from "./Report";
import { JobSelector } from "./Widgets";

import { AppStore, Jobs, Job, JobStatus, loadXHR, ReportField, reportFieldNames, metricNames, metricNameToReportFieldIndex } from "../stores/Stores";
declare var google: any;
declare var tinycolor: any;
let Select = require('react-select');

export class Charts extends React.Component<{
  jobs: Jobs;
}, {
    metrics: string[],
    videos: string[],
    qualities: number[],
    fit: boolean;
    jobsToCompare: Job[]
  }> {
  constructor() {
    super();
    this.state = {
      fit: false,
      jobsToCompare: [],
      metrics: ["MSSSIM", "PSNR HVS"],
      videos: [],
      qualities: []
    };
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
      this.setState({ jobsToCompare: this.props.jobs.jobs } as any);
    });
  }
  getSeries(name: string, metric: string): ScatterPlotSeries[] {
    let series = [];
    let jobs = this.props.jobs.jobs;
    let reportFieldIndex = metricNameToReportFieldIndex(metric);
    jobs.forEach(job => {
      let values = [];
      job.report[name].forEach(row => {
        let bitRate = (row[ReportField.Size] * 8) / row[ReportField.Pixels];
        let quality = row[reportFieldIndex];
        values.push([bitRate, quality]);
      })
      sortArray(values, 0);
      series.push({
        name: job.id,
        values: values,
        color: tinycolor(job.color).darken(50),
        xAxis: this.state.fit ? undefined : {
          min: 0,
          max: 1
        },
        yAxis: this.state.fit ? undefined : {
          min: 0,
          max: 50
        }
      });
    });
    return series;
  }
  onJobSelectorChange(jobsToCompare: Job[], metrics: string[], videos: string[], qualities: number[]) {
    this.setState({ jobsToCompare, metrics, videos, qualities } as any);
  }
  onFitClick() {
    this.setState({ fit: !this.state.fit } as any);
  }
  render() {
    let jobs = this.props.jobs.jobs;
    if (jobs.length == 0) {
      return <div>
        <p>No runs selected.</p>
      </div>
    }

    let tables = [];
    let job = jobs[0];
    let otherJob = jobs[1];
    let metrics = this.state.metrics;
    let qualities = this.state.qualities;
    let jobsToCompare = this.state.jobsToCompare;
    let plotWidth = (1000 / metrics.length) | 0;
    for (let video in job.report) {
      if (this.state.videos.length && this.state.videos.indexOf(video) < 0) {
        continue;
      }
      let videoReport = job.report[video];
      let headers = metrics.map(name =>
        <th key={name} className="tableHeader">{name}</th>
      );
      let cols = metrics.map(metric =>
        <td key={metric} style={{ padding: 0 }}>
          <ScatterPlot width={plotWidth} height={200} series={this.getSeries(video, metric)} />
        </td>
      );
      tables.push(<div key={video} style={{ width: "1000px" }}>
        <div className="tableTitle">{video}</div>
        <Table striped condensed hover>
          <thead>
            <tr>
              {headers}
            </tr>
          </thead>
          <tbody>
            <tr key={video}>{cols}</tr>
          </tbody>
        </Table>
        <VideoReport name={video} job={jobsToCompare[0]} otherJob={jobsToCompare[1]} highlightColumns={metrics} filterQualities={qualities} />
      </div>
      );
    }
    return <div>
      <div style={{ width: "1000px" }}>
        <JobSelector metrics={this.state.metrics} jobs={this.props.jobs.jobs} onChange={this.onJobSelectorChange.bind(this)} />
      </div>
      <div style={{ paddingBottom: 8, paddingTop: 4 }}>
        <div className="selectTitle">Chart Options</div>
        <Button active={this.state.fit} onClick={this.onFitClick.bind(this)}>Fit Chart</Button>
      </div>
      {tables[0]}
      <VideoReport job={jobsToCompare[0]} otherJob={jobsToCompare[1]} highlightColumns={metrics} filterQualities={qualities} />
      {tables.slice(1)}
    </div>;
  }
}