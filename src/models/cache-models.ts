import { GetGuildsResponse, GetShardsResponse } from './cluster-api/index.js';
import { ClusterStatus } from './enums/index.js';

export interface Cluster {
    id: string;
    status: ClusterStatus;
    allocatedShardIds: number[];
    callback: {
        url: string;
        token: string;
    };
    getShards?: GetShardsResponse;
    getGuilds?: GetGuildsResponse;
}
