import {
    IsDefined,
    IsInt,
    IsPositive,
    IsString,
    IsUrl,
    MinLength,
    ValidateNested,
} from 'class-validator';

import { ShardStats } from '../cluster-api';
import { ClusterStatus } from '../enums';

export interface GetClustersResponse {
    clusters: ClusterInfo[];
    stats: ClusterStats;
}

export interface ClusterInfo {
    id: string;
    allocatedShardIds: number[];
    status: ClusterStatus;
    shards?: ShardInfo[];
    stats?: ShardStats;
}

export interface ShardInfo {
    id: number;
    ready: boolean;
    error: boolean;
    uptimeSecs?: number;
}

export interface ClusterStats {
    clusterCount: number;
    shardCount: number;
    serverCount: number;
    serversPerShard: number;
}

export class Callback {
    @IsDefined()
    @IsUrl()
    url: string;

    @IsDefined()
    @IsString()
    @MinLength(5)
    token: string;
}

export class RegisterClusterRequest {
    @IsDefined()
    @IsInt()
    @IsPositive()
    shardCount: number;

    @IsDefined()
    @ValidateNested()
    callback: Callback;
}

export interface RegisterClusterResponse {
    id: string;
}

export interface LoginClusterResponse {
    shardList: number[];
    totalShards: number;
}
