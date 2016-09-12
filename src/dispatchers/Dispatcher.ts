import { Dispatcher } from "flux";

import { Job } from "../stores/Stores"

export var AppDispatcher = new Dispatcher<Action>();

export class Action {

}

export class SelectJob extends Action {
  constructor(public job: Job) {
    super();
  }
}

export class DeselectJob extends Action {
  constructor(public job: Job) {
    super();
  }
}

export class CancelJob extends Action {
  constructor(public job: Job) {
    super();
  }
}

export class SubmitJob extends Action {
  constructor(public job: Job) {
    super();
  }
}
