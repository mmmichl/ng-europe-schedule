import {Component, OnInit, Input} from '@angular/core';
import {ScheduleEntry, EntryType} from '../../model/schedule-entry';
import {ScheduleService} from '../../services/schedule.service';

@Component({
  selector: 'app-list-schedule',
  templateUrl: './list-schedule.component.html'
})
export class ListScheduleComponent implements OnInit {
  @Input() entry: ScheduleEntry;
  EntryType = EntryType;
  displayToggle = false;

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
