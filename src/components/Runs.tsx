import * as React from "react";
import { ListGroup, ListGroupItem } from "react-bootstrap";
import { Badge, ButtonToolbar, DropdownButton, MenuItem } from "react-bootstrap";

import { Run } from "../App";

export interface RunsProps { runs: any; }
export interface RunsState { selectedNick?: string; selectedTask?: string; }

type RunListMap = { [name: string]: Run [] };

function addToMap<T>(map: { [name: string]: T [] }, key: string, element: T) {
  if (!map[key]) {
    map[key] = [];
  }
  map[key].push(element);
}

function getValue(object: any, names: string []) {
  var v = object;
  for (let i = 0; i < names.length; i++) {
    v = v[names[i]];
  }
  return v;
}

function groupListBy(list: any [], path: string): RunListMap {
  var map: RunListMap = {};
  var names = path.split(".");
  list.forEach((element) => {
    addToMap(map, "All", element);
    addToMap(map, getValue(element, names), element);
  });
  return map;
}

export class Runs extends React.Component<RunsProps, RunsState> {
  constructor() {
    super();
    this.state = {
      selectedNick: "All",
      selectedTask: "All"
    };
  }

  onNickSelect(eventKey: any, event: Object): any {
    this.setState({
      selectedNick: eventKey
    });
  }

  onTaskSelect(eventKey: any, event: Object): any {
    this.setState({
      selectedTask: eventKey
    });
  }

  onRunClicked(run: any, eventKey: any, event: Object): any {
    console.info(run);
  }

  render() {
    let runs = this.props.runs;
    let runsByNick = groupListBy(runs, "info.nick");
    let runsByTask = groupListBy(runs, "info.task");

    return <div>
      <ButtonToolbar style={{paddingBottom: 8}}>
        <DropdownButton bsSize="small" style={{minWidth: 120}} title={"Nick: " + this.state.selectedNick} id="bg-nested-dropdown" onSelect={this.onNickSelect.bind(this)}>
          {Object.keys(runsByNick).map((key: string) => {
              return <MenuItem key={key} eventKey={key}>{key}<Badge pullRight={true}>{runsByNick[key].length}</Badge></MenuItem>;
          })}
        </DropdownButton>
        <DropdownButton bsSize="small" style={{minWidth: 120}} title={"Task: " + this.state.selectedTask} id="bg-nested-dropdown" onSelect={this.onTaskSelect.bind(this)}>
          {Object.keys(runsByTask).map((key: string) => {
              return <MenuItem key={key} eventKey={key}>{key}<Badge pullRight={true}>{runsByTask[key].length}</Badge></MenuItem>;
          })}
        </DropdownButton>
      </ButtonToolbar>
      <div style={{height: "512px", overflow: "scroll"}}>
        <ListGroup>
          {runs.filter((run) => {
            let filterNick = this.state.selectedNick === "All" || getValue(run, "info.nick".split(".")) === this.state.selectedNick;
            let filterTask = this.state.selectedTask === "All" || getValue(run, "info.task".split(".")) === this.state.selectedTask;
            return filterNick && filterTask;
          }).map((run: any) => {
            return <ListGroupItem key={run.run_id} className="key" onClick={this.onRunClicked.bind(this, run)} >{run.run_id} - {run.info.nick}</ListGroupItem>;
          })}
        </ListGroup>
      </div>
    </div>
  }
}