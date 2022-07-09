import { Request, Response, Router } from 'express';
import router from 'express-promise-router';
import { createRequire } from 'node:module';
import * as uuid from 'uuid';

import { ClusterCache } from '../caches/index.js';
import { mapClass } from '../middleware/index.js';
import { Cluster } from '../models/cache-models.js';
import { ClusterStatus } from '../models/enums/index.js';
import {
    ClusterInfo,
    GetClustersResponse,
    LoginClusterResponse,
    RegisterClusterRequest,
    RegisterClusterResponse,
    ShardInfo,
} from '../models/master-api/index.js';
import { Controller } from './controller.js';

const require = createRequire(import.meta.url);
let Config = require('../../config/config.json');

export class ClustersController implements Controller {
    public path = '/clusters';
    public router: Router = router();
    public authToken: string = Config.api.secret;

    public register(): void {
        this.router.get('/', (req, res) => this.getClusters(req, res));
        this.router.post('/', mapClass(RegisterClusterRequest), (req, res) =>
            this.registerCluster(req, res)
        );
        this.router.put('/:id/login', (req, res) => this.loginCluster(req, res));
        this.router.put('/:id/ready', (req, res) => this.readyCluster(req, res));
        this.router.delete('/:id', (req, res) => this.unregisterCluster(req, res));
    }

    private async getClusters(req: Request, res: Response): Promise<void> {
        let clusters = ClusterCache.getAll();

        let clusterInfos = clusters.map(cluster => {
            return {
                id: cluster.id,
                status: cluster.status,
                allocatedShardIds: cluster.allocatedShardIds,
                shards: cluster.getShards?.shards.map(shard => {
                    return {
                        id: shard.id,
                        ready: shard.ready,
                        error: shard.error,
                        uptimeSecs: shard.uptimeSecs,
                    } as ShardInfo;
                }),
                stats: cluster.getShards?.stats,
            } as ClusterInfo;
        });

        let shardCount = ClusterCache.totalShards();
        let serverCount = ClusterCache.serverCount();
        let serversPerShard = ClusterCache.serversPerShard();

        let resBody: GetClustersResponse = {
            clusters: clusterInfos,
            stats: {
                clusterCount: clusters.length,
                shardCount,
                serverCount,
                serversPerShard,
            },
        };
        res.status(200).json(resBody);
    }

    private async registerCluster(req: Request, res: Response): Promise<void> {
        let reqBody: RegisterClusterRequest = res.locals.input;

        // Remove old data if previously registered
        let oldCluster = ClusterCache.getAll().find(
            cluster => cluster.callback.url === reqBody.callback.url
        );
        if (oldCluster) {
            ClusterCache.remove(oldCluster.id);
        }

        // Determine shard list
        let shardList: number[] = [];
        let existingShardIds = ClusterCache.shardIds();
        for (let i = 0; i < Number.MAX_SAFE_INTEGER; i++) {
            if (!existingShardIds.includes(i)) {
                shardList.push(i);
            }
            if (shardList.length >= reqBody.shardCount) {
                break;
            }
        }

        // Save data for cluster
        let newCluster: Cluster = {
            id: oldCluster?.id ?? uuid.v4(),
            status: ClusterStatus.REGISTERED,
            allocatedShardIds: shardList,
            callback: reqBody.callback,
        };
        ClusterCache.set(newCluster.id, newCluster);

        // Send response
        let resBody: RegisterClusterResponse = {
            id: newCluster.id,
        };
        res.status(200).json(resBody);
    }

    private async loginCluster(req: Request, res: Response): Promise<void> {
        let clusterId = req.params.id;

        // Find cluster
        let cluster = ClusterCache.get(clusterId);
        if (!cluster) {
            res.sendStatus(404);
            return;
        }

        // Change status to LOGGING_IN
        cluster.status = ClusterStatus.LOGGING_IN;
        ClusterCache.set(clusterId, cluster);

        // Send response
        let resBody: LoginClusterResponse = {
            shardList: cluster.allocatedShardIds,
            totalShards: ClusterCache.totalShards(),
        };
        res.status(200).json(resBody);
    }

    private async readyCluster(req: Request, res: Response): Promise<void> {
        let clusterId = req.params.id;

        // Find cluster
        let cluster = ClusterCache.get(clusterId);
        if (!cluster) {
            res.sendStatus(404);
            return;
        }

        // Change status to READY
        cluster.status = ClusterStatus.READY;
        ClusterCache.set(clusterId, cluster);

        // Send response
        res.sendStatus(200);
    }

    private async unregisterCluster(req: Request, res: Response): Promise<void> {
        let clusterId = req.params.id;

        // Remove cluster
        ClusterCache.remove(clusterId);

        // Send response
        res.sendStatus(200);
    }
}
