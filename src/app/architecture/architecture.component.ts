/**
 * Created by jean on 6/25/16.
 */

import {Component, OnChanges, SimpleChanges} from '@angular/core';
import {MaskSelector} from "../../directives/mask/mask.directive";
import {FocusDirective} from "../../directives/focus/focus-directive";

@Component({
  selector: 'architecture-selector',
  directives: [MaskSelector, FocusDirective],
  template: `<div><h1>Architecture</h1>
    <div class="card">
      <div class="card-block">
       <div class="card-title">
        <div class="form-group">
          <label class="form-control-label">Date</label>
          <div>
            <input type="text" name="projectDate" 
              [(ngModel)]="projectDate" 
              [mask-input]="'99/99/9999'" 
              (keydown)="onKeyDown()" 
              [focused]="projectDateFocused" 
              class="form-control"/>
          </div>
        </div>
         <div class="form-group">
          <label class="form-control-label">Code</label>
          <div class="form-group">
            <input type="text" name="projectCode" 
                [(ngModel)]="projectCode" 
                [focused]="projectCodeFocused" 
                (keydown)="onKeyDown()"
                [mask-input]="'999-AAA'" class="form-control"/>
            <input type="checkbox" name="testCheck" [(ngModel)]="projectCheck"/>
          </div>
        </div>
        <div>
          Model value:{{projectDate}}, {{projectCode}}, {{projectCheck}}
        </div>
       </div>
      </div>
    </div>
  
  </div>`
})
export class ArchitectureComponent implements OnChanges {
  ngOnChanges(changes:SimpleChanges):any {
    console.log('Component changes.');
    return true;
  }
  projectDate:Date = new Date();
  projectCheck:boolean = false;
  projectDateFocused:boolean = false;
  projectCodeFocused:boolean = false;

  ngOnInit() {
    this.projectCodeFocused = true;
  }

  onKeyDown() {
    if(event instanceof KeyboardEvent) {
      let e:KeyboardEvent = event as KeyboardEvent;
      if(e.keyCode === 13) {
        let name:string = e.srcElement.getAttribute('name');
        if(name === 'projectDate') {
          this.projectDateFocused = false;
          this.projectCodeFocused = true;
        } else {
          this.projectDateFocused = true;
          this.projectCodeFocused = false;
        }
      }
    }
  }
}
