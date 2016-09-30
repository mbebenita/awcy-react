import * as React from "react";
import { Button } from "react-bootstrap";
import { ProgressBar } from "react-bootstrap";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from "react-bootstrap";
import { Col, Row } from "react-bootstrap";
import { Panel } from "react-bootstrap";
import { Tabs, Tab } from "react-bootstrap";

import { FullReportComponent } from "./components/FullReport"
import { JobsComponent } from "./components/Jobs"
import { AppStatusComponent } from "./components/AppStatus"
import { AppLogsComponent } from "./components/AppLogs"
import { DebugComponent } from "./components/Debug"

import { appStore, AppStore, Job, JobStatus, SelectJob, AppDispatcher } from "./stores/Stores"

import { AnalyzerComponent, ShareComponent, LoginComponent } from "./components/Widgets"

export class App extends React.Component<void, void> {
  constructor() {
    super();
    appStore.onChange.attach(() => {
      this.forceUpdate();
    });

    appStore.onAnalyzedFilesChanged.attach(() => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    appStore.load();
  }

  render() {
    let analyzerTabs = appStore.analyzedFiles.map((o, i) => {
      return <Tab eventKey={5 + i} key={o.decoderUrl + o.videoUrl + i} title={"Analyzer: " + o.videoUrl}>
        <div style={{ padding: 10, height: window.innerHeight, overflow: "scroll" }}>
          <AnalyzerComponent decoderUrl={o.decoderUrl} videoUrl={o.videoUrl}/>
        </div>
      </Tab>
    });
    console.debug("Rendering App");

    let height = window.innerHeight;
    return <div>
      <div className="sidebar">
        <Tabs defaultActiveKey={1} animation={false} id="noanim-tab-example">
          <Tab eventKey={1} key="runs" title="Runs">
            <div style={{ padding: 10 }}>
              <JobsComponent showFilters jobStatusFilter={JobStatus.Completed} jobs={appStore.jobs} listHeight={height - 200} />
            </div>
          </Tab>
          <Tab eventKey={2} key="jobs" title="Jobs">
            <div style={{ padding: 10 }}>
              <JobsComponent jobStatusFilter={JobStatus.NotCompleted} jobs={appStore.jobs} listHeight={height - 200} />
            </div>
          </Tab>
          <Tab eventKey={3} key="share" title="Share">
            <div style={{ padding: 10 }}>
              <ShareComponent/>
            </div>
          </Tab>
          <Tab eventKey={4} key="login" title="Login">
            <div style={{ padding: 10 }}>
              <LoginComponent/>
            </div>
          </Tab>
        </Tabs>
      </div>
      <div className="content">
        <Tabs defaultActiveKey={3} animation={false} id="noanim-tab-example">
          <Tab eventKey={3} key="graphs" title="Report">
            <div style={{ padding: 10, height: height - 100, overflow: "scroll" }}>
              <FullReportComponent jobs={appStore.selectedJobs} />
            </div>
          </Tab>
          <Tab eventKey={4} key="logs" title="Logs">
            <div style={{ padding: 10, height: height - 100, overflow: "scroll" }}>
              <AppLogsComponent/>
            </div>
          </Tab>
          <Tab eventKey={5} key="status" title="Status">
            <div style={{ padding: 10, height: height - 100, overflow: "scroll" }}>
              <AppStatusComponent/>
            </div>
          </Tab>
          <Tab eventKey={6} key="debug" title="Debug">
            <div style={{ padding: 10, height: height - 100, overflow: "scroll" }}>
              <DebugComponent/>
            </div>
          </Tab>
          {analyzerTabs}
        </Tabs>
      </div>
    </div>
  }
}