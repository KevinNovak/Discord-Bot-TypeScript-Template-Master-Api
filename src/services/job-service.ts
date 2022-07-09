import schedule from 'node-schedule/index.js';
import { createRequire } from 'node:module';

import { Job } from '../jobs/index.js';
import { Logger } from './index.js';

const require = createRequire(import.meta.url);
let Logs = require('../../lang/logs.json');

export class JobService {
    constructor(private jobs: Job[]) {}

    public start(): void {
        for (let job of this.jobs) {
            schedule.scheduleJob(job.schedule, async () => {
                try {
                    if (job.log) {
                        Logger.info(Logs.info.jobRun.replace('{JOB}', job.name));
                    }

                    await job.run();

                    if (job.log) {
                        Logger.info(Logs.info.jobCompleted.replace('{JOB}', job.name));
                    }
                } catch (error) {
                    Logger.error(Logs.error.job.replace('{JOB}', job.name), error);
                }
            });
            Logger.info(
                Logs.info.jobScheduled
                    .replace('{JOB}', job.name)
                    .replace('{SCHEDULE}', job.schedule)
            );
        }
    }
}
