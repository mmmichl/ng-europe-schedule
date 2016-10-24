import {Injectable} from '@angular/core';
import {Http, Response} from '@angular/http';


import 'rxjs/add/operator/toPromise';
import {ScheduleEntry, EntryType} from '../model/schedule-entry';
import moment from 'moment';

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
    loadShippedSchedule();

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


function loadShippedSchedule() {
  if (!localStorage.getItem(SCHEDULE_STORE_KEY)) {
    console.log('loading shipped schedule');
    let schedule = SHIPPED_SCHEDULE;

    localStorage.setItem(SCHEDULE_STORE_KEY, JSON.stringify(schedule));
  }
}

const SHIPPED_SCHEDULE = [{
  "type": 3,
  "title": "Conference Day 1",
  "time": null,
  "duration": null,
  "description": null
}, {
  "type": 6,
  "title": "Registration",
  "time": "2016-10-25T06:30:00.000Z",
  "duration": 90,
  "description": "Make sure to get in early at 323bis Rue de Charenton, 75012 Paris https://goo.gl/maps/t4FKT93C25u"
}, {
  "type": 2,
  "title": "Breakfast",
  "time": "2016-10-25T06:45:00.000Z",
  "duration": 60,
  "description": "Your typical French breakfast with croissants, coffee and more."
}, {
  "type": 7,
  "title": "Keynote",
  "time": "2016-10-25T08:00:00.000Z",
  "duration": 25,
  "description": "In the early goals of Angular 2, we focused on creating a full platform that encompasses even more of the needs of our developer community. Mobile is all the rage these of late, but the majority of successful product teams have investment across web, mobile web, installed mobile apps and even installed desktop applications. From individual developers all the way to CIOs, folks would like to reuse both their development expertise and their code across these platforms to deliver quickly and at minimal cost. Please join us for a chat on how we're addressing this full space of development needs in Angular 2."
}, {
  "type": 7,
  "title": "Angular & RxJS",
  "time": "2016-10-25T08:30:00.000Z",
  "duration": 25,
  "description": "Learn to use reactivity to supercharge your Angular apps using RxJS."
}, {
  "type": 1,
  "title": "Coffee Break",
  "time": "2016-10-25T09:00:00.000Z",
  "duration": 30,
  "description": "Socialize, have some coffee or other drinks."
}, {
  "type": 7,
  "title": "Angular BatScanner",
  "time": "2016-10-25T09:30:00.000Z",
  "duration": 25,
  "description": "Yet another Angular 2 devtool, Angular BatScanner is focus on performance analysis. Like debugging the performance bottleneck is hard. I made a tool to visualize what is happening for Angular when your application is running. It's similar to Timeline Tool but using the Angular Component vocabulary. By hooking into the components life cycle system we can quickly explore a record to answer : - when, where and why a change happened - how often it's changed - how much time a components took to react to it - etc..."
}, {
  "type": 7,
  "title": "Custom widgets for Angular2? Piece of cake!",
  "time": "2016-10-25T10:00:00.000Z",
  "duration": 25,
  "description": "\"With the rest of the angular-ui/bootstrap team I've set out recently to migrate Bootstrap widgets to Angular 2. To my delight the resulting https://ng-bootstrap.github.io library offers much better APIs and was significantly easier to write as compared to the Angular 1 counterpart. During this talk I would go over specific patterns and tricks in Angular 2 that makes custom widget development a cakewalk.\""
}, {
  "type": 2,
  "title": "French Buffet",
  "time": "2016-10-25T10:30:00.000Z",
  "duration": 90,
  "description": "Lunch time! Socialize while eating at our delicious buffet."
}, {
  "type": 7,
  "title": "Data science with angular",
  "time": "2016-10-25T12:00:00.000Z",
  "duration": 25,
  "description": "Data is everywhere; it's in our apps,, servers, and all over the internet. It's the backbone for our applications. In this talk, we'll look at how data flows through our app and how to capture it efficiently in our apps. We'll look at methods for taking and processing data, interacting with it in our application, and ways to process it with JavaScript. We'll take a dive into the world of data science and visualization with Angular 2 to boot."
}, {
  "type": 7,
  "title": "Unit Tests for Angular 2 Applications",
  "time": "2016-10-25T12:30:00.000Z",
  "duration": 25,
  "description": "This talk will cover the latest and greatest test utilities we have in Angular 2 to help unit test your components and Applications."
}, {
  "type": 1,
  "title": "Coffee Break",
  "time": "2016-10-25T13:00:00.000Z",
  "duration": 30,
  "description": "Socialize, have some coffee or other drinks."
}, {
  "type": 7,
  "title": "Embed hybrid features in Mobile Banking App",
  "time": "2016-10-25T13:30:00.000Z",
  "duration": 25,
  "description": "ING bank is facing a challenge in scaling up their mobile app development. The wish list of new features is long and good native mobile engineers are hard to find. A solution could be hybrid app development but there are a lot of preconceptions about this technology. We delivered a solution which tightly integrate native and hybrid and delivers: - seamless user experience o Native close UI implementation using IONIC and extending with custom ING theme o Javascript briges, which integrate the hybrid feature with mobile app extensions points using Cordova framework in a secure way. For example, HttpPlugin intercepts all http requests and route them to the native layer. - Scale to an enterprise level o Continuous integration to enable web developers easily performs integration tests with native extension points, without having knowledge of native app development o ING the guide implements ING visual identity and provides reusable components to use in hybrid solution."
}, {
  "type": 7,
  "title": "Security in Angular 2",
  "time": "2016-10-25T14:00:00.000Z",
  "duration": 25,
  "description": "Secure your Angular application! Learn about Angular's philosophy on tackling security, the rationale behind the security APIs, and get rid of Cross Site Scripting (XSS) once and for all."
}, {
  "type": 1,
  "title": "Coffee Break",
  "time": "2016-10-25T14:30:00.000Z",
  "duration": 30,
  "description": "Socialize, have some coffee or other drinks."
}, {
  "type": 7,
  "title": "Getting to Angular 2",
  "time": "2016-10-25T15:00:00.000Z",
  "duration": 25,
  "description": "Angular 2 has exciting performance and developer velocity benefits, but migrating a large, complex, existing application can seem daunting. Come learn real-world strategies for upgrading with sanity. We'll cover iterative migration strategies and talk about ways new Angular 2 APIs can help you manage large codebases. This talk will be grounded in the strategies Google is currently using to migrate public, in-production applications."
}, {
  "type": 7,
  "title": "Typescript latest",
  "time": "2016-10-25T15:30:00.000Z",
  "duration": 25,
  "description": "In this talk we will explore what's new in 2.0, what’s coming in 2.1 and what Typescript helps you accomplish."
}, {
  "type": 7,
  "title": "AngularFire2 and you",
  "time": "2016-10-25T16:00:00.000Z",
  "duration": 25,
  "description": "Discover how Firebase can streamline development processes and how to easily add AngularFire2 to your Angular2 apps."
}, {
  "type": 7,
  "title": "Lightning talks",
  "time": "2016-10-25T16:30:00.000Z",
  "duration": 30,
  "description": "Submit your lightning talk proposal!"
}, {
  "type": 2,
  "title": "Dinner",
  "time": "2016-10-25T17:00:00.000Z",
  "duration": 150,
  "description": "Drinks, food, music."
}, {"type": 3, "title": "Conference Day 2", "time": null, "duration": null, "description": null}, {
  "type": 6,
  "title": "Check-in",
  "time": "2016-10-26T06:30:00.000Z",
  "duration": 30,
  "description": "Make sure to get in early."
}, {
  "type": 2,
  "title": "Breakfast",
  "time": "2016-10-26T06:45:00.000Z",
  "duration": 75,
  "description": "Your typical French breakfast with croissants, coffee and more."
}, {
  "type": 7,
  "title": "Angular CLI & You",
  "time": "2016-10-26T08:00:00.000Z",
  "duration": 25,
  "description": "The Angular CLI makes it simple and easy to get started. Learn about creating and running projects with the CLI, testing and deployin, with a quick look at the technology that supports your Angular projects."
}, {
  "type": 7,
  "title": "New Insights into Angular 2 Applications with Augury",
  "time": "2016-10-26T08:30:00.000Z",
  "duration": 25,
  "description": "Augury is a Chrome Developer Tools extension that allows developers to visualize their Angular 2.0 application’s component tree and the data associated with it. Our goal with this project is two-fold: help developers find bugs in their Angular 2.0 applications but also allow them to visualize their applications and their higher level structure at runtime. Our long term vision is also to help developers optimize the performance of their application using this tool. Augury itself is an open source effort started at Rangle.io and is developed using TypeScript and Angular 2.0."
}, {
  "type": 1,
  "title": "Coffee Break",
  "time": "2016-10-26T09:00:00.000Z",
  "duration": 30,
  "description": "Socialize, have some coffee or other drinks."
}, {
  "type": 7,
  "title": "Getting Universal with Angular 2",
  "time": "2016-10-26T09:30:00.000Z",
  "duration": 25,
  "description": "This is a quick introduction to Universal (isomorphic) JavaScript support for Angular 2. The Angular Universal project aims to add support for server side rendering to Angular 2 apps. In other words, with Universal you will be able to render your Angular 2 application both on the client and the server. If you're curious and want to know and see how Angular 2 is handling universality then don't miss this talk."
}, {
  "type": 7,
  "title": "From UI-Router to Component Router",
  "time": "2016-10-26T10:00:00.000Z",
  "duration": 25,
  "description": "Angular2 introduced a brand new powerful router. For those of us who have been developing with Angular 1.x for years, it requires a change in the way we perceive routing. Since Angular2 requires composing Component Trees instead of MVC ‘views’, we have much more flexibility then ever before. During this talk Nir will help you make the switch from UI-Router/NG-router to the component router through a series of side by side comparison of all key features. Topics to be covered: - Configuring the component router - Passing route parameters - Creating nested routes - Hooking to the router lifecycle - Side by side feature comparison of UI router and Component router"
}, {
  "type": 2,
  "title": "French Buffet",
  "time": "2016-10-26T10:30:00.000Z",
  "duration": 90,
  "description": "Lunch time! Socialize while eating at our delicious buffet."
}, {
  "type": 7,
  "title": "Reactive Music Apps in Angular and RxJS",
  "time": "2016-10-26T12:00:00.000Z",
  "duration": 25,
  "description": "Angular 2 combined with RxJS, @ngrx/store, and Immutable.js is a fantastic platform for reactive web applications. If we also add hot loading and the Web Audio API to the mix, we end up with something truly exciting: A platform for reactive music creation. This talk is about creating musical systems on the Angular platform. We’ll see how we can use @ngrx/store and Observables to model a generative music process that the user can control on the fly. It’s a really enjoyable way to learn reactive Angular application development!"
}, {
  "type": 7,
  "title": "ngAnimate2 = Layouts + Animations",
  "time": "2016-10-26T12:30:00.000Z",
  "duration": 25,
  "description": "In addition to animations, ngAnimate2 can also boost the capabilities of how the user interface behaves in Angular2. Let’s dive in and see how animations work alongside states and layout mechanics in Angular2 and how they enable developers to create a powerful, responsive and flexible UI system."
}, {
  "type": 1,
  "title": "Coffee Break",
  "time": "2016-10-26T13:00:00.000Z",
  "duration": 30,
  "description": "Socialize, have some coffee or other drinks."
}, {
  "type": 7,
  "title": "Evolution of Web on Mobile",
  "time": "2016-10-26T13:30:00.000Z",
  "duration": 25,
  "description": "In this session we’ll take a step back to study the history of the mobile web platform, and exactly what has made it both unique and highly successful. We’ll review how the combination of new standardized APIs, improved devices and relentless open source communities have driven the mobile web to what it is today. There’s no doubt that the development stack has improved dramatically with modern the web platform, browsers and devices. We’ll discuss how Ionic is able to take advantage of these awesome new technologies, such as progressive web apps, to easily create beautiful, high-performing web apps that can be scaled on the largest distribution channel in the world: the web."
}, {
  "type": 7,
  "title": "You will learn RxJS",
  "time": "2016-10-26T14:00:00.000Z",
  "duration": 25,
  "description": "Description: Reactive programming with Observables can seem like a hard skill to learn. In this talk you will see Andre live code and explain the basics of RxJS Observables in a way that will demystify the concepts. We will build our own Observable from scratch, as well as our own basic operators, then see why RxJS can easily solve your async events problems."
}, {
  "type": 1,
  "title": "Coffee Break",
  "time": "2016-10-26T14:30:00.000Z",
  "duration": 30,
  "description": "Socialize, have some coffee or other drinks."
}, {
  "type": 7,
  "title": "Minifying Angular 2 Applications",
  "time": "2016-10-26T15:00:00.000Z",
  "duration": 25,
  "description": "Minification used to be a topic for library developers who distribute a foo-min.js script for users to drop into their page. With ES6 modules, we can do better, by minifying the entire application along with its dependencies into a single .js bundle. We will cover the tooling pipeline, from Angular's template compiler, through tree-shaking, bundling, and minification."
}, {
  "type": 7,
  "title": "Full throttle Cross-platform development with Angular 2, Cordova and Electron",
  "time": "2016-10-26T15:30:00.000Z",
  "duration": 25,
  "description": "Fasten your seatbelt and join the Angular 2 Cross Platform race! In this talk you'll see how to bring your Angular applications to any platform using the browser, Apache Cordova and GitHub Electron. Join Christian Weyer and Thorsten Hans on the road trip from the web, over mobile devices to all major desktop platforms - with Angular 2 as the engine and GulpJS as the fuel."
}, {
  "type": 7,
  "title": "Custom renderers in Angular 2",
  "time": "2016-10-26T16:00:00.000Z",
  "duration": 25,
  "description": "The rendering architecture of Angular 2 is one of its major strength. This is the reason why it can run in a webworker or on a server. It also enables the creation of custom renderers so that an application can generate a simple markdown file, or a full mobile application with react-native. Let's dive into it and discover how great it is!"
}, {
  "type": 5,
  "title": "Q&A Panel",
  "time": "2016-10-26T16:30:00.000Z",
  "duration": 60,
  "description": "This is your opportunity to ask questions to the team. Use the tag #AskNgEurope on twitter and we'll forward them your question."
}, {
  "type": 4,
  "title": "Drink up",
  "time": "2016-10-26T17:30:00.000Z",
  "duration": 120,
  "description": "Have a last drink before leaving."
}];
