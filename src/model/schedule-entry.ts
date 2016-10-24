export enum EntryType {
  UNKOWN,
  BREAK,
  EAT,
  NEW_DAY,
  PLAY,
  QUESTIONS,
  REGISTRATION,
  TALK
}

export class ScheduleEntry {
  constructor(
    public type: EntryType,
    public title: string,
    public time?: Date,
    public duration?: number,
    public description?: string
  ) {
    // console.log('crested ScheduleEntry with', this);
  }
}
