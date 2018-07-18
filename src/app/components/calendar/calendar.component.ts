import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
import * as _ from 'lodash';
import { CalendarDate } from '../models/calendar';
import { DataService } from '../../services/data.service';


@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnChanges {

  currentDate = moment();
  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  weeks: CalendarDate[][] = [];
  sortedDates: CalendarDate[] = [];
  isWeekly: boolean;
  initFirstOfMonth: any;
  initFirstDayOfGrid: any;
  isMobile: boolean;
  eventArray: any;

  @Input() selectedDates: CalendarDate[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit(): void {
    this.dataService.getEvents()
      .subscribe(
        data => {
          this.eventArray = data;
          this.generateCalendar();
        }
      )
    this.detectMobile();
  }

  detectMobile() {
    window.addEventListener('resize', () => {
      if (window.innerWidth < 768) {
        this.isMobile = true
      } else {
        this.isMobile = false

      }
    })
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedDates &&
      changes.selectedDates.currentValue &&
      changes.selectedDates.currentValue.length > 1) {
      // sort on date changes for better performance when range checking
      this.sortedDates = _.sortBy(changes.selectedDates.currentValue, (m: CalendarDate) => m.mDate.valueOf());
      this.generateCalendar();
    }
  }

  // date checkers
  isToday(date: moment.Moment): boolean {
    return moment().isSame(moment(date), 'day');
  }

  isSelected(date: moment.Moment): boolean {
    return _.findIndex(this.selectedDates, (selectedDate) => {
      return moment(date).isSame(selectedDate.mDate, 'day');
    }) > -1;
  }

  isSelectedMonth(date: moment.Moment): boolean {
    return moment(date).isSame(this.currentDate, 'month');
  }

  // handle actions from calendar
  prevWeek(): any {
    this.currentDate = moment(this.currentDate).subtract(7, 'days');
    this.generateWeekly();
  }

  nextWeek(): void {
    this.currentDate = moment(this.currentDate).add(7, 'days');
    this.generateWeekly();
  }

  prevMonth(): any {
    this.currentDate = moment(this.currentDate).subtract(1, 'months');
    this.checkView();
  }

  nextMonth(): void {
    this.currentDate = moment(this.currentDate).add(1, 'months');
    this.checkView();
  }

  firstMonth(): void {
    this.currentDate = moment(this.currentDate).startOf('year');
    this.checkView();
  }

  lastMonth(): void {
    this.currentDate = moment(this.currentDate).endOf('year');
    this.checkView();
  }

  prevYear(): void {
    this.currentDate = moment(this.currentDate).subtract(1, 'year');
    this.checkView();
  }

  nextYear(): void {
    this.currentDate = moment(this.currentDate).add(1, 'year');
    this.checkView();
  }

  weekView() {
    if (!this.isWeekly) {
      this.isWeekly = true;
      this.generateWeekly();
    } else {
      this.isWeekly = false;
      this.generateCalendar(42)
    }
  }

  generateWeekly() {
    this.generateCalendar(7, 'week')
  }

  checkView() {
    if (this.isWeekly) {
      this.generateWeekly()
    } else {
      this.generateCalendar();
    }
  }

  // generate the calendar grid
  generateCalendar(option = 42, weekOrMonth = 'month'): any {
    const dates = this.fillDates(this.currentDate, option, weekOrMonth);
    const weeks: CalendarDate[][] = [];
    while (dates.length > 0) {
      weeks.push(dates.splice(0, 7));
    }
    this.weeks = weeks;
  }

  fillDates(currentMoment: moment.Moment, option, weekOrMonth): CalendarDate[] {
    const firstOfMonth = moment(currentMoment).startOf(weekOrMonth).day();
    const firstDayOfGrid = moment(currentMoment).startOf(weekOrMonth).subtract(firstOfMonth, 'days');
    const start = firstDayOfGrid.date();
    return _.range(start, start + option)
      .map((date: number): CalendarDate => {
        const d = moment(firstDayOfGrid).date(date);
        let events = [];
        let totalEvents;
        this.eventArray.forEach(event => {
          if (moment(event.createdAt).local().format('YYYY-MM-DD') === moment(d).local().format('YYYY-MM-DD')) {
            event.createdAt = new Date(moment.utc(event.createdAt).local().format('YYYY-MM-DD HH:mm:ss')).toISOString()
            events.push(event);
          }
        })
        totalEvents = events.length;
        if (!this.isWeekly) {
          events = events.splice(0, 2)
        }
        return {
          today: this.isToday(d),
          mDate: d,
          events,
          totalEvents
        };
      });
  }
}
