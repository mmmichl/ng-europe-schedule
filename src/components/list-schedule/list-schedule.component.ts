import {Component, OnInit, Input} from '@angular/core';
import {ScheduleEntry, EntryType} from '../../schedule-entry';
import {ScheduleService} from '../../services/schedule.service';

@Component({
  selector: 'app-list-schedule',
  templateUrl: './list-schedule.component.html',
  styleUrls: ['./list-schedule.component.css']
})
export class ListScheduleComponent implements OnInit {
  @Input() schedule: ScheduleEntry;
  EntryType = EntryType;
  displayToggle = {};

  constructor(private scheduleService: ScheduleService) {}

  ngOnInit() {
  }

  isStarable(entry: ScheduleEntry): boolean {
    return entry.type === EntryType.TALK
      || entry.type === EntryType.QUESTIONS
      || entry.type === EntryType.PLAY;
  }

  isStarred(entry: ScheduleEntry): boolean {
    return this.scheduleService.isStarred(entry);
  }

  toggleStar(entry: ScheduleEntry) {
    this.scheduleService.toggleStar(entry);
  }
}
