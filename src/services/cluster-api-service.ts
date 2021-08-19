import { URL } from 'url';

import { HttpService } from '.';
import {
    GetGuildsResponse,
    GetShardsResponse,
    SetShardPresencesRequest,
} from '../models/cluster-api';

export class ClusterApiService {
    constructor(private httpService: HttpService) {}

    public async getShards(baseUrl: string, token: string): Promise<GetShardsResponse> {
        let res = await this.httpService.get(new URL(`/shards`, baseUrl), token);

        if (!res.ok) {
            throw res;
        }

        return res.json();
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

        return res.json();
    }
}
