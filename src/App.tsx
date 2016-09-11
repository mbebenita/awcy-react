import * as React from "react";
import { AppDispatcher, Action } from "./dispatchers/Dispatcher"
import * as Actions from "./dispatchers/Dispatcher"
import { Button } from "react-bootstrap";
import { ProgressBar } from "react-bootstrap";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Navbar, Nav, NavItem, NavDropdown, MenuItem } from "react-bootstrap";
import { Col, Row } from "react-bootstrap";
import { Panel } from "react-bootstrap";
import { Tabs, Tab } from "react-bootstrap";

import { FullReport } from "./components/Report"
import { Charts } from "./components/Charts"
import { Runs } from "./components/Runs"
import { JobList } from "./components/Jobs"
import { JobLogView } from "./components/Log"

import { AppStore, Job, JobStatus } from "./stores/Stores"

export interface AppProps { }
export interface AppState { }

export class App extends React.Component<AppProps, AppState> {
  store: AppStore;
  constructor() {
    super();
    this.store = new AppStore();

    this.store.onChange.attach(() => {
      this.forceUpdate();
    });
  }

  componentDidMount() {
    this.store.load();
  }

  onJobSelected(job: Job) {
    debugger;
    AppDispatcher.dispatch(new Actions.SelectJob(job));
  }

  render() {
    return <div style={{display: "table", paddingTop: 10, paddingLeft: 5, width: "100%"}}>
      <div style={{display: "table-row"}}>
        <div style={{width: "300px" , display: "table-cell"}}>
          <Tabs defaultActiveKey={1} animation={false} id="noanim-tab-example">
            <Tab eventKey={1} key="runs" title="Runs">
              <div style={{padding: 10}}>
                <JobList store={this.store.jobs} onSelectChanged={this.onJobSelected.bind(this)}/>
              </div>
            </Tab>
            <Tab eventKey={2} key="jobs" title="Jobs">
              <div style={{padding: 10}}>
                <JobList store={this.store.jobs} onSelectChanged={this.onJobSelected.bind(this)}/>
              </div>
            </Tab>
          </Tabs>
        </div>
        <div style={{display: "table-cell"}}>
          <Tabs defaultActiveKey={3} animation={false} id="noanim-tab-example">
            <Tab eventKey={3} key="graphs" title="Graphs">
              <div style={{padding: 10}}>
                <Charts jobs={this.store.selectedJobs}/>
              </div>
            </Tab>
            <Tab eventKey={4} key="report" title="Report">
              <div style={{padding: 10}}>

              </div>
            </Tab>
          </Tabs>
        </div>
      </div>
    </div>;

// <FullReport jobs={this.store.selectedJobs}/>

    // <FullReport jobs={this.store.selectedJobs}/>

    // <div>
    //   <Tabs defaultActiveKey={1} animation={false} id="noanim-tab-example" style={{width: 1200}}>
    //     <Tab eventKey={1} title="Home">
    //       <table style={{width: 1400}}>
    //         <tr>
    //           <td>
    //             <Panel header={<h2>Runs</h2>} >
    //               <JobList store={this.store.jobs}
    //                         onSelectChanged={this.onJobSelected.bind(this)}/>
    //             </Panel>
    //           </td>
    //           <td>
    //             <Tabs defaultActiveKey={1} animation={false} id="noanim-tab-example">
    //               <Tab eventKey={1} key="graphs" title="Graphs">
    //                 <Panel>
    //                   <Charts jobs={this.store.selectedJobs}/>
    //                 </Panel>
    //               </Tab>
    //               <Tab eventKey={2} key="report" title="Report">
    //                 <Panel>
    //                   <Report jobs={this.store.selectedJobs}/>
    //                 </Panel>
    //               </Tab>
    //             </Tabs>
    //           </td>
    //         </tr>
    //       </table>
    //     </Tab>
    //     <Tab eventKey={3} title="Timeline"></Tab>
    //     <Tab eventKey={4} title="Images"></Tab>
    //     <Tab eventKey={5} title="Analyzer"></Tab>
    //     <Tab eventKey={6} title="Help"></Tab>
    //   </Tabs>
    // </div>
  }x
}