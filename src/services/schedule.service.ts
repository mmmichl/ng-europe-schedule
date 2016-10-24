import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';


import 'rxjs/add/operator/toPromise';
import {ScheduleEntry, EntryType} from '../schedule-entry';
import * as moment from 'moment';

const SCHEDULE_STORE_KEY = 'schedule';
const STARS_STORE_KEY = 'stars';

let scheduleCache: ScheduleEntry[] = null;

@Injectable()
export class ScheduleService {

  constructor(private http: Http) {
  }

  /**
   * Accesses ngeurope.org and parses schedule
   */
  public update(): Promise<ScheduleEntry[]> {
    return this.http.get('https://ngeurope.org')
      .toPromise()
      .then((response: Response) => {
        let entries: ScheduleEntry[] = [];

        const el = document.createElement('html');
        el.innerHTML = response.text();

        const scheduleWrapper = el.querySelector('#day3-collapse');
        if (!scheduleWrapper) {
          throw new Error('Update Error: could not parse ng-europe page [could not find #day3-collapse]');
        }

        const scheduleList = scheduleWrapper.getElementsByClassName('timeline');
        if (scheduleList.length <= 0) {
          throw new Error('Update Error: could not parse ng-europe page [could not find .timeline]');
        }

        const scheduleEntries = scheduleList[0].getElementsByTagName('li');
        for (let i = 0; i < scheduleEntries.length; i++) {
          try {
            entries.push(parseEntry(scheduleEntries.item(i)));
          } catch (e) {
            console.error('failed to parse entry', scheduleEntries.item(i));
            entries.push(new ScheduleEntry(EntryType.UNKOWN, '[parse error]'));
          }
        }

        console.log(`Successfully parsed ${entries.length} entries`);

        scheduleCache = entries;
        window.localStorage.setItem(SCHEDULE_STORE_KEY, JSON.stringify(entries));

        return entries;
      });
  }

  public getStored(): ScheduleEntry[] {
    if (!scheduleCache) {
      const store = JSON.parse(window.localStorage.getItem(SCHEDULE_STORE_KEY));
      if (store) {
        scheduleCache = store.map(e => new ScheduleEntry(
          e.type,
          e.title,
          e.time,
          e.duration,
          e.description
        ));
      } else {
        console.log('did not found any stored schedules');
        return [];
      }
    }

    return scheduleCache;
  }

  getStarred(): Set<number> {
    const storedStar = window.localStorage.getItem(STARS_STORE_KEY) || '[]';
    return new Set<number>(JSON.parse(storedStar));
  }

  removeStar(entry: ScheduleEntry) {
    const idx = findIdx(scheduleCache, entry);
    const starred = this.getStarred();

    starred.delete(idx);
    window.localStorage.setItem(STARS_STORE_KEY, JSON.stringify(Array.from(starred)));
  }

  addStar(entry: ScheduleEntry) {
    const idx = findIdx(scheduleCache, entry);
    const starred = this.getStarred();

    starred.add(idx);
    window.localStorage.setItem(STARS_STORE_KEY, JSON.stringify(Array.from(starred)));
  }

  toggleStar(entry: ScheduleEntry) {
    if (this.isStarred(entry)) {
      this.removeStar(entry);
    } else {
      this.addStar(entry);
    }
  }

  isStarred(entry: ScheduleEntry) {
    const idx = findIdx(scheduleCache, entry);
    return this.getStarred().has(idx);
  }
}

function findIdx(schedule: ScheduleEntry[], entry: ScheduleEntry) {
  for (let i = 0; i < schedule.length; i++) {
    if (schedule[i].title === entry.title) {
      return i;
    }
  }

  throw new Error('cannot find entry in schedule' + JSON.stringify(entry));
}

function parseEntry(liEntry: HTMLLIElement): ScheduleEntry {
  let timeNDuration = liEntry.querySelector('.timeline-panel .timeline-heading .text-muted');
  let description = liEntry.querySelector('.timeline-panel .timeline-body');

  return new ScheduleEntry(
    parseType(liEntry.querySelector('.timeline-badge i').className),
    liEntry.querySelector('.timeline-panel .timeline-title').textContent,
    timeNDuration && moment(timeNDuration.childNodes[1].textContent.trim(), 'MMM DD, YYYY, hh:mma').toDate(),
    timeNDuration && parseInt(timeNDuration.childNodes[3].textContent.trim(), 10),
    description && description.textContent
  );
}

function parseType(classList: string): EntryType {
  const classTypeMap = {
    'fa-calendar': EntryType.NEW_DAY,
    'fa-ticket': EntryType.REGISTRATION,
    'fa-cutlery': EntryType.EAT,
    'fa-microphone': EntryType.TALK,
    'fa-coffee': EntryType.BREAK,
    'fa-question': EntryType.QUESTIONS,
    'fa-play': EntryType.PLAY
  };

  for (let c of Object.keys(classTypeMap)) {
    if (classList.indexOf(c) !== -1) {
      return classTypeMap[c];
    }
  }

  return EntryType.UNKOWN;
}
