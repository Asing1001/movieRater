import * as fetch from 'isomorphic-fetch';
import { scheduleJob } from 'node-schedule';
import { systemSetting, schedulerSetting } from '../configs/systemSetting';
import { updateTheaterWithLocationList } from '../task/yahooTask';
import { updatePttArticles } from '../task/pttTask';
import { updateImdbInfo } from '../task/imdbTask';
import cacheManager from '../data/cacheManager';
import { updateMoviesSchedules } from '../task/atmoviesTask';
import { updateLINEMovies } from '../task/lineTask';

export function initScheduler() {
  if (!systemSetting.enableScheduler) {
    return;
  }
  console.log('[Scheduler] init');

  scheduleJob('10 * * * *', async function () {
    console.time('[Scheduler] updateLINEMovies');
    await updateLINEMovies();
    console.timeEnd('[Scheduler] updateLINEMovies');
  });

  scheduleJob('15 * * * *', async function () {
    console.time('[Scheduler] updatePttArticles');
    await updatePttArticles(schedulerSetting.pttPagePerTime);
    console.timeEnd('[Scheduler] updatePttArticles');
  });

  scheduleJob('20 * * * *', async function () {
    await cacheManager.setRecentMoviesCache();
    await updateMoviesSchedules();
    await cacheManager.setMoviesSchedulesCache();
  });

  scheduleJob('30 5 * * *', async function () {
    console.time('[Scheduler] updateTheaterWithLocationList');
    await updateTheaterWithLocationList();
    console.timeEnd('[Scheduler] updateTheaterWithLocationList');
  });

  scheduleJob('40 5 * * *', async function () {
    console.time('[Scheduler] cacheManager.init');
    await cacheManager.init();
    console.timeEnd('[Scheduler] cacheManager.init');
  });

  scheduleJob('30 6 * * *', async function () {
    console.time('[Scheduler] updateImdbInfo');
    await updateImdbInfo();
    console.timeEnd('[Scheduler] updateImdbInfo');
  });
}
