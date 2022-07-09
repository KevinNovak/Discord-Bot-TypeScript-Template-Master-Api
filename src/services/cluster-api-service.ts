import { URL } from 'node:url';

import {
    GetGuildsResponse,
    GetShardsResponse,
    SetShardPresencesRequest,
} from '../models/cluster-api/index.js';
import { HttpService } from './index.js';

export class ClusterApiService {
    constructor(private httpService: HttpService) {}

    public async getShards(baseUrl: string, token: string): Promise<GetShardsResponse> {
        let res = await this.httpService.get(new URL(`/shards`, baseUrl), token);

        if (!res.ok) {
            throw res;
        }

        return (await res.json()) as GetShardsResponse;
    }

    public async setShardPresences(
        baseUrl: string,
        token: string,
        setShardPresencesReq: SetShardPresencesRequest
    ): Promise<void> {
        let res = await this.httpService.put(
            new URL(`/shards/presence`, baseUrl),
            token,
            setShardPresencesReq
        );

        if (!res.ok) {
            throw res;
        }
    }

    public async getGuilds(baseUrl: string, token: string): Promise<GetGuildsResponse> {
        let res = await this.httpService.get(new URL(`/guilds`, baseUrl), token);

        if (!res.ok) {
            throw res;
        }

        return (await res.json()) as GetGuildsResponse;
    }
}
