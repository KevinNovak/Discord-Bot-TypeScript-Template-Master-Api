import { GetGuildsResponse, GetShardsResponse } from './cluster-api';
import { ClusterStatus } from './enums';

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
