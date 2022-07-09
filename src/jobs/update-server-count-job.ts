import { createRequire } from 'node:module';

import { ClusterCache } from '../caches/index.js';
import { BotSite } from '../models/config-models.js';
import { ClusterApiService, HttpService, Logger } from '../services/index.js';
import { Job } from './job.js';

const require = createRequire(import.meta.url);
let BotSites: BotSite[] = require('../../config/bot-sites.json');
let Config = require('../../config/config.json');
let Lang = require('../../lang/lang.json');
let Logs = require('../../lang/logs.json');

export class UpdateServerCountJob implements Job {
    public name = 'Update Server Count';
    public schedule: string = Config.jobs.updateServerCount.schedule;
    public log: boolean = Config.jobs.updateServerCount.log;

    private botSites: BotSite[];

    constructor(private clusterApiService: ClusterApiService, private httpService: HttpService) {
        this.botSites = BotSites.filter(botSite => botSite.enabled);
    }

    public async run(): Promise<void> {
        let serverCount = ClusterCache.serverCount();

        let clusters = ClusterCache.online();
        for (let cluster of clusters) {
            try {
                await this.clusterApiService.setShardPresences(
                    cluster.callback.url,
                    cluster.callback.token,
                    {
                        type: Lang.serverCount.type,
                        name: Lang.serverCount.name.replaceAll(
                            '{SERVER_COUNT}',
                            serverCount.toLocaleString()
                        ),
                        url: Lang.serverCount.url,
                    }
                );
            } catch (error) {
                Logger.error(
                    Logs.error.updateClusterPresence.replaceAll('{CLUSTER_ID}', cluster.id),
                    error
                );
                continue;
            }
        }

        Logger.info(
            Logs.info.updatedServerCount.replaceAll('{SERVER_COUNT}', serverCount.toLocaleString())
        );

        for (let botSite of this.botSites) {
            try {
                let body = JSON.parse(
                    botSite.body.replaceAll('{{SERVER_COUNT}}', serverCount.toString())
                );
                let res = await this.httpService.post(botSite.url, botSite.authorization, body);

                if (!res.ok) {
                    throw res;
                }
            } catch (error) {
                Logger.error(
                    Logs.error.updateServerCountSite.replaceAll('{BOT_SITE}', botSite.name),
                    error
                );
                continue;
            }

            Logger.info(Logs.info.updateServerCountSite.replaceAll('{BOT_SITE}', botSite.name));
        }
    }
}
