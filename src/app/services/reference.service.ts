import {Injectable} from 'angular2/core';
import {Http} from 'angular2/http';

export class Legacy {
  loc:number;
  dayHour:number;
  offshore:number;
  locRatio:number;
  selected:LegacyCode;
  legacyCode:LegacyCode[];
}

export class LegacyCode {
  id:number;
  name:string;
  info:string;
  locRatio:number;
}

@Injectable()
export class ReferenceService {

  constructor(public http: Http) {

  }

  getData() {
    console.log('ReferenceService#getData(): Get Data');
    return this.http.get('/assets/json/references.json').map(res => res.json());
  }
}
