import * as React from "react";
import { Tabs, Tab, Table, ListGroup, ListGroupItem } from "react-bootstrap";
import { Jumbotron, Grid, Popover, OverlayTrigger, Navbar, Checkbox, Form, FormGroup, ControlLabel, FormControl, HelpBlock, Modal, Panel, Label, Col, Row, Button, ProgressBar, Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";

import { BDRatePlot, sortArray, ScatterPlotSeries, PlotAxis } from "./Plot";
import { VideoReport, BDRateReportComponent } from "./Report";
import { JobSelector } from "./Widgets";
import { Promise } from "es6-promise";
import { AnalyzerVideoSelector, AnalyzerComponent } from "./Widgets";

import { AppStore, Jobs, Job, JobStatus, loadXHR, ReportField, reportFieldNames, metricNames, metricNameToReportFieldIndex } from "../stores/Stores";
declare var google: any;
declare var tinycolor: any;
declare var require: any;
let Select = require('react-select');

export class FullReport extends React.Component<{
  jobs: Jobs;
}, {
    metrics: string[],
    videos: string[],
    qualities: number[],
    fit: boolean;
    stack: boolean;
    jobsToCompare: Job[];
  }> {
  constructor() {
    super();
    this.state = {
      fit: true,
      stack: false,
      jobsToCompare: [],
      metrics: ["MSSSIM"],
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
        name: job.selectedName,
        label: job.id,
        values: values,
        color: job.color,
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
  onStackClick() {
    this.setState({ stack: !this.state.stack } as any);
  }
  renderVideoReport(video: string, stack: boolean) {
    let jobs = this.props.jobs.jobs;
    let metrics = this.state.metrics;
    let qualities = this.state.qualities;
    let headers = metrics.map(name =>
      <th key={name} className="tableHeader">{name}</th>
    );
    let rows, cols;
    if (!stack) {
      let plotWidth = (940 / metrics.length) | 0;
      let plotHeight = 200;
      cols = metrics.map(metric =>
        <td key={metric} style={{ padding: 0 }}>
          <BDRatePlot width={plotWidth} height={plotHeight} series={this.getSeries(video, metric)} />
        </td>
      );
      rows = [<tr key={video}>{cols}</tr>];
    } else {
      let plotWidth = 940;
      let plotHeight = 400;
      headers = [<th key={name} className="tableHeader"></th>];
      rows = [];
      metrics.forEach(metric => {
        rows.push(<tr key={metric + "-Header"}><td className="tableHeader">{metric}</td></tr>);
        rows.push(<tr key={metric}>
          <td style={{ padding: 0 }}>
            <BDRatePlot width={plotWidth} height={plotHeight} series={this.getSeries(video, metric)} />
          </td>
        </tr>);
      });
    }
    let tabs = jobs.map((job, i) => {
      return <Tab eventKey={i} key={job.id} title={job.id}>
        <div style={{paddingTop: 10}}>
          <VideoReport name={video} job={job} highlightColumns={metrics} filterQualities={qualities} />
        </div>
      </Tab>
    });
    return <div key={video}>
      <Panel header={video}>
        <Table condensed bordered={false}>
          <thead>
            <tr>
              {headers}
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </Table>
        <Tabs bsStyle="pills" animation={false} id="noanim-tab-example">
          {tabs}
        </Tabs>
        <AnalyzerVideoSelector video={video} jobs={jobs}/>
      </Panel>
    </div>
  }
  render() {
    console.debug("Rendering Full Report");
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
    for (let video in job.report) {
      if (this.state.videos.length && this.state.videos.indexOf(video) < 0) {
        continue;
      }
      if (video === "Total") {
        continue;
      }
      tables.push(this.renderVideoReport(video, this.state.stack));
    }
    let report = <BDRateReportComponent a={jobsToCompare[0]} b={jobsToCompare[1]}/>
    return <div style={{ width: "980px" }}>
      <div>
        <JobSelector metrics={this.state.metrics} jobs={this.props.jobs.jobs} onChange={this.onJobSelectorChange.bind(this)} />
      </div>
      <div style={{ paddingBottom: 8, paddingTop: 4 }}>
        <Button active={this.state.fit} onClick={this.onFitClick.bind(this)}>Scale Charts</Button>{' '}
        <Button active={this.state.stack} onClick={this.onStackClick.bind(this)}>Enlarge Charts</Button>
      </div>
      <div style={{ paddingTop: 8 }}>
        {this.renderVideoReport("Total", this.state.stack)}
        {report}
        {tables}
      </div>
    </div>;
  }
}