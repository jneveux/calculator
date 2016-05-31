import {Component} from 'angular2/core';
import {AppState} from '../app.service';
import {AutoComplete} from '../../directives/autocomplete/autocomplete.directive';

import {Title} from './title';
import {XLarge} from './x-large';

import {ReferenceService, Legacy, LegacyCode} from '../services';

interface Data {
  value:string
}

@Component({
  /** The selector is what angular internally uses
   * for `document.querySelectorAll(selector)` in our index.html
   * where, in this case, selector is the string 'home'
   * <home></home>
   */
  selector: 'home',
  /**
   * We need to tell Angular's Dependency Injection which providers are in our app.
   */
  providers: [
    Title, ReferenceService
  ],
  /**
   * We need to tell Angular's compiler which directives are in our template.
   * Doing so will allow Angular to attach our behavior to an element
   */
  directives: [
    XLarge, AutoComplete
  ],
  /**
   * We need to tell Angular's compiler which custom pipes are in our template.
   */
  pipes: [],
  /**
   * Our list of styles in our component. We may add more to compose many styles together
   */
  styles: [require('./home.css')],
  /**
   *  Every Angular template is first compiled by the browser before Angular runs it's compiler
   */
  template: require('./home.html')
})
export class Home {
  // Set our default values
  localState = {value: ''};
  data = {};
  locHour:string = "LOC / Hour";
  legacy:Legacy;
  /**
   * Auto complete field bound to {@link LegacyCode}
   */
  legacyCode:LegacyCode;
  results:LegacyCode[];
  selectedLegacyCode:LegacyCode[] = [];

  private _selectionEnd:number = 0;

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
    if (this.appState.get('quickCalculator') != null) {
      this.legacy = this.appState.get('quickCalculator');
    }
  }

  submitState(value):void {
    console.log('submitState', value);
    this.appState.set('value', value);
    this.appState.set('quickCalculator', this.legacy);
  }

  selectCode(value:LegacyCode):void {
    console.log('Selected value: ', value);
    this.legacy.selected = value;
    this.legacy.locRatio = value.locRatio;
  }


  /**
   * Perform a search when keywords are typed in the auto complete input.
   * @see Component {@link AutoComplete}
   * @param event
     */
  search(event):void {
    this.results = [];
    let eventTarget:HTMLInputElement = event.originalEvent.target;
    let selectionStart:number = eventTarget.selectionStart;
    this._selectionEnd = eventTarget.selectionEnd;
    let arrSearch:string[] = event.query.split(' ');
    let search:string = '';
    if (arrSearch.length > 0) {
      // selection is in the same segment.
      if (selectionStart === this._selectionEnd && this._selectionEnd === event.query) {
        search = arrSearch[arrSearch.length - 1];
      } else {
        let idx:number = 0;
        for (let i = 0; i < arrSearch.length; i++) {
          idx += arrSearch[i].length;
          if(this._selectionEnd >= idx ) {
            search = arrSearch[i];
          }
        }
      }
    }
    for (let i = 0; i < this.legacy.legacyCode.length; i++) {
      if (this.legacy.legacyCode[i].name.toLocaleLowerCase().startsWith(event.query.toLowerCase())
        || this.legacy.legacyCode[i].name.toLocaleLowerCase() === event.query.toLowerCase()) {
        this.results.push(this.legacy.legacyCode[i]);
      }
    }
  }

  /**
   * Adds the selected Legacy Code to the list.
   * @param event LegacyCode object selected from the auto complete.
   */
  public onSelectAuto(event:LegacyCode):void {
    this.selectedLegacyCode.push(event);
    console.log('Selected legacy code', this.selectedLegacyCode);
    this.legacyCode = null;
  }
  
  testClick():void {
    console.log('Clicked!');
    this.legacy.selected = this.legacy.legacyCode[0];
  }

  changeValueOffshore(value:number):void {
    if (value === -1 && this.legacy.offshore >= 0) {
      this.legacy.offshore -= 5;
    } else if (this.legacy.offshore <= 100) {
      this.legacy.offshore += 5;
    }
  }

  changeValueLocRatio(value:number):void {
    if (value === -1 && this.legacy.locRatio >= 0) {
      this.legacy.offshore -= 5;
    } else if (this.legacy.offshore <= 3000) {
      this.legacy.offshore += 5;
    }
  }
}
