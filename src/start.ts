import { createRequire } from 'node:module';
import 'reflect-metadata';

import { Api } from './api.js';
import { ClustersController, RootController } from './controllers/index.js';
import { UpdateClusterCacheJob } from './jobs/index.js';
import { UpdateServerCountJob } from './jobs/update-server-count-job.js';
import { ClusterApiService, HttpService, JobService, Logger } from './services/index.js';

const require = createRequire(import.meta.url);
let Logs = require('../lang/logs.json');

async function start(): Promise<void> {
    Logger.info(Logs.info.started);

    // Services
    let httpService = new HttpService();
    let clusterApiService = new ClusterApiService(httpService);

    // API
    let clustersController = new ClustersController();
    let rootController = new RootController();
    let api = new Api([clustersController, rootController]);

    // Jobs
    let jobService = new JobService([
        new UpdateClusterCacheJob(clusterApiService),
        new UpdateServerCountJob(clusterApiService, httpService),
    ]);

    jobService.start();
    await api.start();
}

start();
