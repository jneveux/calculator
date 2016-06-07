import {Component} from 'angular2/core';
import {ArchitectureService, ArchitectureModel} from "../service/architecture.service";

@Component({
  selector: 'home-selector',
  providers: [ArchitectureService],
  template: `
  <div *ngIf="!data.types">
    <div class="form-group row">
      <label class="col-sm-2 form-control-label">Application name</label>
      <div class="col-sm-4">
        <input type="text" [(ngModel)]="data.name" class="form-control"/>
      </div>
    </div>
    <div class="form-group row">
      <label class="col-sm-2 form-control-label">How many module(s)?
      <br/>
      <small class="text-muted">
        A module should be identified as an application executed in a different container.
      </small>
      </label>
      
      <div class="col-sm-1">
        <input type="number" [(ngModel)]="data.layers" class="form-control input-sm"/>
      </div>
    </div>
    <div  class="form-group row">
     <label class="col-sm-2 form-control-label" for="ntier">Is architecture N-TIER?</label>
     <div class="col-sm-1">
     <input id="ntier" type="checkbox" [(ngModel)]="data.ntier" class="form-control"/>
     </div>
   </div>
  </div>`
})
export class HomeComponent {
  data:ArchitectureModel;

  constructor(public architectureService:ArchitectureService) {
    this.data = architectureService.init();
  }
}
