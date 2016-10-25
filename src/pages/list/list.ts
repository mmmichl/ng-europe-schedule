import {Component, OnInit} from '@angular/core';

import { NavController, NavParams } from 'ionic-angular';

import { ItemDetailsPage } from '../item-details/item-details';
import {ScheduleService} from '../../services/schedule.service';
import {ScheduleEntry, EntryType} from '../../model/schedule-entry';

import moment from 'moment';


@Component({
  templateUrl: 'list.html'
})
export class ListPage implements OnInit {
  public schedule: ScheduleEntry[] = [];
  EntryType = EntryType;
  toggleHidden = false;

  selectedItem: any;
  icons: string[];
  items: Array<{title: string, note: string, icon: string}>;

  constructor(public navCtrl: NavController, public navParams: NavParams,
              private scheduleService: ScheduleService) {
    // If we navigated to this page, we will have an item available as a nav param
    this.selectedItem = navParams.get('item');

    this.icons = ['flask', 'wifi', 'beer', 'football', 'basketball', 'paper-plane',
    'american-football', 'boat', 'bluetooth', 'build'];

    this.items = [];
    for(let i = 1; i < 11; i++) {
      this.items.push({
        title: 'Item ' + i,
        note: 'This is item #' + i,
        icon: this.icons[Math.floor(Math.random() * this.icons.length)]
      });
    }
  }

  ngOnInit() {
    this.schedule = this.scheduleService.getStored();

    if (navigator.onLine) {
      //this.scheduleService.update();
    }
  }

  itemTapped(event, item) {
    this.navCtrl.push(ItemDetailsPage, {
      item: item
    });
  }

  showEntry(entry: ScheduleEntry): boolean {
    return this.timeNow() < moment(entry.time).add(entry.duration, 'm').toDate();
  }

  timeNow() {
    return new Date();
  }
}
