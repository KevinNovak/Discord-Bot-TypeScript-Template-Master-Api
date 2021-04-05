import { ClusterCache } from '../caches';
import { BotSite } from '../models/config-models';
import { ClusterApiService, HttpService, Logger } from '../services';
import { Job } from './job';

let Config = require('../../config/config.json');
let BotSites: BotSite[] = require('../../config/bot-sites.json');
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
                        name: Lang.serverCount.name.replace(
                            '{SERVER_COUNT}',
                            serverCount.toLocaleString()
                        ),
                        url: Lang.serverCount.url,
                    }
                );
            } catch (error) {
                Logger.error(
                    Logs.error.updateClusterPresence.replace('{CLUSTER_ID}', cluster.id),
                    error
                );
                continue;
            }
        }

        Logger.info(
            Logs.info.updatedServerCount.replace('{SERVER_COUNT}', serverCount.toLocaleString())
        );

        for (let botSite of this.botSites) {
            try {
                let body = JSON.parse(
                    botSite.body.replace('{{SERVER_COUNT}}', serverCount.toString())
                );
                let res = await this.httpService.post(botSite.url, botSite.authorization, body);

                if (!res.ok) {
                    throw res;
                }
            } catch (error) {
                Logger.error(
                    Logs.error.updateServerCountSite.replace('{BOT_SITE}', botSite.name),
                    error
                );
                continue;
            }

            Logger.info(Logs.info.updateServerCountSite.replace('{BOT_SITE}', botSite.name));
        }
    }
}
