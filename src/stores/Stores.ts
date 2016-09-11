import { AppDispatcher, Action, SelectJob, DeselectJob } from "../dispatchers/Dispatcher"
import { Promise } from "es6-promise"
import { AsyncEvent } from 'ts-events';

let baseUrl = "https://arewecompressedyet.com/";

function zip(a: string [], b: any []) {
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
  None,
  Running,
  Pending,
  Completed
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

export type Report = {[name: string]: number [][]};

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
  logText: string = "";
  onLogTextChange = new AsyncEvent<string>();
  selected: boolean = false;
  color: string = "";
  onChange = new AsyncEvent<string>();
  constructor() {

  }
  loadLog(path: string) {
    loadXHR(path, (text) => {
      this.logText = text;
      this.onLogTextChange.post("log-updated");
    }, "text");
  }

  loadFile(path: string): Promise<string> {
    return new Promise((resolve, reject) => {
      loadXHR(path, (text) => {
        resolve(text);
      }, "text");
    });
  }

  loadFiles(paths: string []): Promise<string []> {
    return Promise.all(paths.map(path => this.loadFile(path)));
  }


  report: Report = null
  loadReport(): Promise<{[name: string]: any}> {
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
    "daala":    "Daala",
    "x264":     "x264",
    "x265":     "x265",
    "x265-rt":  "x265 Realtime",
    "vp8":      "VP8",
    "vp9":      "VP9",
    "vp10":     "VP10",
    "vp10-rt":  "VP10 Realtime",
    "av1":      "AV1 (High Latency CQP)",
    "av1-rt":   "AV1 (Low Latency CQP)",
    "thor":     "Thor",
    "thor-rt":  "Thor Realtime"
  };

  static sets = { };
}

export class Jobs {
  jobs: Job [] = [];
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
  "#FEE",
  "#EEF",
  "#EFE",
  "#EFF",
  "#FE6"
];

let nextColorIndex = 0;

function nextColor(): string {
  let r = colorPool[nextColorIndex];
  nextColorIndex = (nextColorIndex + 1) % colorPool.length;
  return r;
}

export class AppStore {
  jobs: Jobs;
  selectedJobs: Jobs;
  onChange = new AsyncEvent<string>();

  constructor() {
    this.jobs = new Jobs();
    this.selectedJobs = new Jobs();

    AppDispatcher.register((action) => {
      if (action instanceof SelectJob) {
        let job = action.job;
        job.selected = true;
        job.color = nextColor();
        job.onChange.post("job-changed");
        this.selectedJobs.addJob(job);
      } else if (action instanceof DeselectJob) {
        let job = action.job;
        job.selected = false;
        job.color = "";
        job.onChange.post("job-changed");
        this.selectedJobs.removeJob(job);
      }
    });
  }
  load() {
    this.loadJobs();
  }
  loadJobs() {
    loadXHR("sets.json", (json) => {
      Job.sets = json;
    });

    // loadXHR("run_job.json", (json) => {
    //   let job = Job.fromJSON(json);
    //   this.jobs.currentJob = job;
    //   job.loadLog(`runs/${job.id}/output.txt`);
    //   job.status = JobStatus.Running;
    //   this.jobs.addJob(job);
    //   this.jobs.onChange.post("job-added");
    // });
    // loadXHR("run_job_queue.json", (json) => {
    //   json.forEach(o => {
    //     let job = Job.fromJSON(o);
    //     this.jobs.addJob(job);
    //   });
    //   this.jobs.onChange.post("job-added");
    // });

    // loadXHR(baseUrl + "runs/av1_pvq_sync_check_2pass_3f_2016-09-06T19-09-29.335Z/objective-1-fast/total.out", (text) => {
    //   console.info(text);
    // }, "text");

    loadXHR("list.json", (json) => {
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
