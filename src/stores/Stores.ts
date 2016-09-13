import { Dispatcher } from "flux";

export var AppDispatcher = new Dispatcher<Action>();
export class Action { }
export class SelectJob extends Action {
  constructor(public job: Job) {
    super();
  }
}
export class DeselectJob extends Action {
  constructor(public job: Job) { super(); }
}
export class CancelJob extends Action {
  constructor(public job: Job) { super(); }
}
export class SubmitJob extends Action {
  constructor(public job: Job) { super(); }
}

import { Promise } from "es6-promise"
import { AsyncEvent } from 'ts-events';

// let baseUrl = "https://arewecompressedyet.com/";
let baseUrl = "https://beta.arewecompressedyet.com/";

function zip(a: string[], b: any[]) {
  let o = {};
  for (let i = 0; i < a.length; i++) {
    o[a[i]] = b[i];
  }
  return o;
}

export function loadXHR(path: string, next: (json: any) => void, type = "json") {
  let xhr = new XMLHttpRequest();
  let self = this;
  xhr.open("GET", path, true);
  xhr.responseType = type;
  xhr.send();
  xhr.addEventListener("load", function () {
    if (xhr.status != 200) {
      return;
    }
    next(this.response);
  });
}

export enum JobStatus {
  None = 0,
  Running = 1,
  Pending = 2,
  Completed = 4,
  All = Running | Pending | Completed
}

export enum ReportField {
  Q,
  Pixels,
  Size,
  PSNR_Y,
  PSNR_HVS,
  SSIM,
  FAST_SSIM,
  CIEDE_2000,
  PSNR_Cb,
  PSNR_Cr,
  APSNR_Y,
  APSNR_Cb,
  APSNR_Cr,
  MSSSIM,
  Time
}

export type Report = { [name: string]: number[][] };

export let metricNames = [
  "PSNR Y", "PSNR HVS", "SSIM", "FAST SSIM", "CIEDE 2000",
  "PSNR Cb", "PSNR Cr", "APSNR Y", "APSNR Cb", "APSNR Cr",
  "MSSSIM", "Time"
];

export let reportFieldNames = [
  "Q", "Pixels", "Size"
].concat(metricNames);

export function metricNameToReportFieldIndex(name: string) {
  return 3 + metricNames.indexOf(name);
}

export class JobProgress {
  constructor(
    public value: number,
    public total: number) {
    // ...
  }
}
export class Job {
  codec: string = "";
  commit: string = "";
  buildOptions: string = "";
  extraOptions: string = "";
  nick: string = "";
  qualities: string = "";
  id: string = "";
  task: string = "";
  taskType: string = "";
  runABCompare: boolean = false;
  saveEncodedFiles: boolean = false;
  status: JobStatus = JobStatus.None;
  log: string = "";
  progress: JobProgress = new JobProgress(0, 0);
  selected: boolean = false;
  selectedName: string = "";
  color: string = "";
  onChange = new AsyncEvent<string>();
  constructor() {

  }
  loadLog(refresh = false): Promise<string> {
    if (this.log && !refresh) {
      return Promise.resolve(this.log);
    }
    return new Promise((resolve, reject) => {
      let path = baseUrl + `runs/${this.id}/output.txt`;
      loadXHR(path, (text) => {
        this.log = text;
        let lastLine = text.match(/([0-9]+) out of ([0-9]+)/g).slice(-1)[0].split(' ');
        if (lastLine) {
          let value = Number(lastLine[0]);
          let total = Number(lastLine[3]);
          this.progress = new JobProgress(value, total);
          this.onChange.post("progress");
        }
        resolve(text);
      }, "text");
    })
  }

  loadFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      loadXHR(path, (text) => {
        resolve(text);
      }, "text");
    });
  }

  loadFiles(paths: string[]): Promise<string[]> {
    return Promise.all(paths.map(path => this.loadFile(path)));
  }


  report: Report = null
  loadReport(): Promise<{ [name: string]: any }> {
    if (this.report) {
      return Promise.resolve(this.report);
    }

    // Total Report
    let names = ["Total"];
    let paths = [baseUrl + `runs/${this.id}/${this.task}/total.out`];

    // File Report
    names = names.concat(Job.sets[this.task].sources);
    paths = paths.concat(Job.sets[this.task].sources.map(name => {
      // TODO: Fix -daala suffix.
      return baseUrl + `runs/${this.id}/${this.task}/${name}-daala.out`;
    }));
    return this.loadFiles(paths).then(textArray => {
      let data = textArray.map(text => text.split("\n").filter(line => !!line).map(line => line.trim().split(" ").map(value => Number(value))));
      return this.report = zip(names, data);
    });
  }

  static fromJSON(json: any) {
    let job = new Job();
    job.id = json.run_id;
    job.nick = json.nick;
    job.qualities = json.qualities;
    job.buildOptions = json.build_options;
    job.codec = json.codec;
    job.commit = json.commit;
    job.extraOptions = json.extra_options;
    job.task = json.task;
    job.taskType = json.task_type;
    job.status = json.status;
    return job;
  }

  static codecs = {
    "daala": "Daala",
    "x264": "x264",
    "x265": "x265",
    "x265-rt": "x265 Realtime",
    "vp8": "VP8",
    "vp9": "VP9",
    "vp10": "VP10",
    "vp10-rt": "VP10 Realtime",
    "av1": "AV1 (High Latency CQP)",
    "av1-rt": "AV1 (Low Latency CQP)",
    "thor": "Thor",
    "thor-rt": "Thor Realtime"
  };

  static sets = {};
}

export class Jobs {
  jobs: Job[] = [];
  onChange = new AsyncEvent<string>();
  constructor() {
  }
  addJobInternal(job: Job) {
    if (this.jobs.indexOf(job) >= 0) {
      return;
    }
    this.jobs.push(job);
  }
  addJob(job: Job) {
    if (this.jobs.indexOf(job) >= 0) {
      return;
    }
    this.jobs.push(job);
    this.onChange.post("job-added");
  }
  removeJob(job: Job) {
    let index = this.jobs.indexOf(job);
    if (index >= 0) {
      this.jobs.splice(index, 1);
      this.onChange.post("job-removed");
    }
  }
  cancelAllJobs() {
    this.jobs = [];
    this.onChange.post("jobs-deleted");
  }
  getById(id: string) {
    for (let i = 0; i < this.jobs.length; i++) {
      if (this.jobs[i].id === id) {
        return this.jobs[i];
      }
    }
    return null;
  }
}

let colorPool = [
  '#a6cee3','#1f78b4','#b2df8a','#33a02c','#fb9a99','#e31a1c','#fdbf6f','#ff7f00','#cab2d6','#6a3d9a','#b15928'
  // `#FF0000`, `#00FF00`, `#0000FF`, `#FF00FF`, `#0000FF`, `#800000`, `#008080`, `#000080`
];

function getColorForString(s: string): string {
  let t = 0;
  for (let i = 0; i < s.length; i++) {
    t += s.charCodeAt(i);
  }
  return colorPool[t % colorPool.length];
}

let selectedNamePool = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export class AppStore {
  jobs: Jobs;
  selectedJobs: Jobs;
  onChange = new AsyncEvent<string>();
  runningJob: Job;
  onRunningJobChange = new AsyncEvent<string>();

  aws: any;
  onAWSChange = new AsyncEvent<string>();

  constructor() {
    this.jobs = new Jobs();
    this.selectedJobs = new Jobs();
    this.runningJob = null;
    this.aws = {};
    AppDispatcher.register((action) => {
      if (action instanceof SelectJob) {
        let job = action.job;
        job.selected = true;
        job.selectedName = selectedNamePool.shift();
        job.color = getColorForString(job.id);
        job.onChange.post("job-changed");
        this.selectedJobs.addJob(job);
      } else if (action instanceof DeselectJob) {
        let job = action.job;
        selectedNamePool.unshift(job.selectedName);
        job.selected = false;
        job.selectedName = "";
        job.color = "";
        job.onChange.post("job-changed");
        this.selectedJobs.removeJob(job);
      } else if (action instanceof CancelJob) {
        let job = action.job;
        this.jobs.removeJob(job);
        if (this.runningJob === job) {
          this.runningJob = null
        }
        this.onRunningJobChange.post("job-cancelled");
      }
    });
  }
  load() {
    this.loadJobs();
  }
  loadAWS() {
    loadXHR(baseUrl + "describeAutoScalingInstances", (json) => {
      this.aws.AutoScalingInstances = json.AutoScalingInstances;
      this.onAWSChange.post("loaded");
    });
    loadXHR(baseUrl + "describeAutoScalingGroups", (json) => {
      this.aws.AutoScalingGroups = json.AutoScalingGroups;
      this.onAWSChange.post("loaded");
    });
  }
  loadBDRateReport(a: Job, b: Job) {
    // betaBaseUrl + "bd_rate" + `?a=${a.id}&b=${}`
    // https://beta.arewecompressedyet.com/bd_rate?
    // a=int-init-qm-2016-09-09T14-25-37.630Z&
    // b=daala-master-2016-09-09T15-34-15.715Z&
    // method=report-overlap&
    // set=objective-1-fast&
    // file=objective-1-fast/total.out&
    // format=json
  }
  loadJobs() {
    loadXHR(baseUrl + "sets.json", (json) => {
      Job.sets = json;
    });

    loadXHR(baseUrl + "run_job.json", (json) => {
      if (!json) return;
      let job = Job.fromJSON(json);
      job.status = JobStatus.Running;
      this.runningJob = job;
      this.runningJob.loadLog();
      this.onRunningJobChange.post("job-added");
      this.jobs.addJob(job);
      this.jobs.onChange.post("job-added");
    });

    loadXHR(baseUrl + "run_job_queue.json", (json) => {
      if (!json) return;
      json.forEach(o => {
        let job = Job.fromJSON(o);
        job.status = JobStatus.Pending;
        this.jobs.addJob(job);
      });
      this.jobs.onChange.post("job-added");
    });

    this.loadAWS();

    loadXHR(baseUrl + "list.json", (json) => {
      json = json.filter(job => job.info.task === "objective-1-fast" && job.info.codec === "av1");
      json.sort(function (a, b) {
        return (new Date(b.date) as any) - (new Date(a.date) as any);
      });
      json = json.slice(0, 100);
      json.forEach(o => {
        let job = Job.fromJSON(o.info);
        job.status = JobStatus.Completed;
        this.jobs.addJobInternal(job);
      });
      this.jobs.onChange.post("job-added");

      // AppDispatcher.dispatch(new SelectJob(this.jobs.jobs[0]));
      // AppDispatcher.dispatch(new SelectJob(this.jobs.jobs[1]));
    });
  }
}
