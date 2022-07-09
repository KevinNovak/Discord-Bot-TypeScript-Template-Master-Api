import { FetchError } from 'node-fetch';
import { createRequire } from 'node:module';

import { ClusterCache } from '../caches/index.js';
import { ClusterStatus } from '../models/enums/index.js';
import { ClusterApiService, Logger } from '../services/index.js';
import { Job } from './job.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');
let Logs = require('../../lang/logs.json');

export class UpdateClusterCacheJob implements Job {
    public name = 'Update Cluster Cache';
    public schedule: string = Config.jobs.updateClusterCache.schedule;
    public log: boolean = Config.jobs.updateClusterCache.log;

    private updateStatuses = [
        ClusterStatus.READY,
        ClusterStatus.ONLINE,
        ClusterStatus.OFFLINE,
        ClusterStatus.ERROR,
    ];

    constructor(private clusterApiService: ClusterApiService) {}

    public async run(): Promise<void> {
        let clusters = ClusterCache.getAll().filter(cluster =>
            this.updateStatuses.includes(cluster.status)
        );
        for (let cluster of clusters) {
            try {
                let shards = await this.clusterApiService.getShards(
                    cluster.callback.url,
                    cluster.callback.token
                );
                cluster.getShards = shards;

                let guilds = await this.clusterApiService.getGuilds(
                    cluster.callback.url,
                    cluster.callback.token
                );
                cluster.getGuilds = guilds;

                // Set cluster status
                let partiallyOnline = cluster.getShards.shards.some(
                    shard => !(shard.ready === true && shard.error === false)
                );
                cluster.status = partiallyOnline
                    ? ClusterStatus.PARTIALLY_ONLINE
                    : ClusterStatus.ONLINE;
            } catch (error) {
                Logger.error(
                    Logs.error.updateClusterCache.replaceAll('{CLUSTER_ID}', cluster.id),
                    error
                );

                if (error instanceof FetchError && error.code === 'ECONNREFUSED') {
                    cluster.status = ClusterStatus.OFFLINE;
                } else {
                    cluster.status = ClusterStatus.ERROR;
                }
            }

            ClusterCache.set(cluster.id, cluster);
        }

        ClusterCache.save();
    }
}
