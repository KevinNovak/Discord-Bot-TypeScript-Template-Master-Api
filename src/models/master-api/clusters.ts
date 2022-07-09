import { Type } from 'class-transformer';
import {
    IsDefined,
    IsInt,
    IsPositive,
    IsString,
    IsUrl,
    Length,
    ValidateNested,
} from 'class-validator';

import { ShardStats } from '../cluster-api/index.js';
import { ClusterStatus } from '../enums/index.js';

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
    @IsUrl({ require_tld: false })
    url: string;

    @IsDefined()
    @IsString()
    @Length(5, 2000)
    token: string;
}

export class RegisterClusterRequest {
    @IsDefined()
    @IsInt()
    @IsPositive()
    shardCount: number;

    @IsDefined()
    @ValidateNested()
    @Type(() => Callback)
    callback: Callback;
}

export interface RegisterClusterResponse {
    id: string;
}

export interface LoginClusterResponse {
    shardList: number[];
    totalShards: number;
}
