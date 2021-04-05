import 'reflect-metadata';

import { Api } from './api';
import { ClustersController, RootController } from './controllers';
import { UpdateClusterCacheJob } from './jobs';
import { UpdateServerCountJob } from './jobs/update-server-count-job';
import { ClusterApiService, HttpService, JobService, Logger } from './services';

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
