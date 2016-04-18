import {Component} from 'angular2/core';
import {AppState} from '../app.service';

import {Title} from './title';
import {XLarge} from './x-large';

import {ReferenceService, Legacy, LegacyCode} from '../services';

interface Data {
  value:string
}

@Component({
  // The selector is what angular internally uses
  // for `document.querySelectorAll(selector)` in our index.html
  // where, in this case, selector is the string 'home'
  selector: 'home',  // <home></home>
  // We need to tell Angular's Dependency Injection which providers are in our app.
  providers: [
    Title, ReferenceService
  ],
  // We need to tell Angular's compiler which directives are in our template.
  // Doing so will allow Angular to attach our behavior to an element
  directives: [
    XLarge
  ],
  // We need to tell Angular's compiler which custom pipes are in our template.
  pipes: [],
  // Our list of styles in our component. We may add more to compose many styles together
  styles: [require('./home.css')],
  // Every Angular template is first compiled by the browser before Angular runs it's compiler
  template: require('./home.html')
})
export class Home {
  // Set our default values
  localState = {value: ''};
  data = {};
  locHour: string = "LOC / Hour";
  legacy:Legacy;

  constructor(public appState:AppState, public title:Title, public referenceService:ReferenceService) {

  }

  ngOnInit() {
    console.log('hello `Home` component');
    this.title.getData().subscribe(data => this.data = data);
    this.referenceService.getData().subscribe(data => this.legacy.legacyCode = data.legacyCode);
    this.legacy = new Legacy();
    this.legacy.loc = 0;
    this.legacy.locRatio = 0;
    this.legacy.offshore = 0;
  }

  submitState(value) : void {
    console.log('submitState', value);
    this.appState.set('value', value);
  }

  selectCode(value: LegacyCode) : void {
    console.log('Selected value: ', value);
    this.legacy.selected = value;
    this.legacy.locRatio = value.locRatio;
  }

  testClick() : void {
    console.log('Clicked!');
    this.legacy.selected = this.legacy.legacyCode[0];
  }

  changeValueOffshore(value: number) : void {
    if(value === -1 && this.legacy.offshore >= 0) {
      this.legacy.offshore -= 5;
    } else if(this.legacy.offshore <= 100) {
      this.legacy.offshore += 5;
    }
  }

  changeValueLocRatio(value: number) : void {
    if(value === -1 && this.legacy.locRatio >=0) {
      this.legacy.offshore -= 5;
    } else if(this.legacy.offshore <= 3000) {
      this.legacy.offshore += 5;
    }
  }
}
