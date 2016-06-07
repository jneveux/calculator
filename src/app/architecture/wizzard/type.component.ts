import {Component} from 'angular2/core';
import {ArchitectureService, ArchitectureModel} from "../service/architecture.service";

@Component({
  selector: 'type-selector',
  providers: [ArchitectureService],
  template: `
  <div class="row">
    <div  class="col-md-6">
      <label class="form-label col-md-2">Type of layer</label>      
      <div class="col-md-3 form-control"><select></select></div>
    </div>
    <div class="col-md-6">
      <label class="control-label">Technology</label>
      <div>... Technology selector</div>
    </div>
    </div>
  `
})
export class TypeComponent {
  data:ArchitectureModel;

  constructor(public architectureService:ArchitectureService) {
    this.data = architectureService.init();
  }
}
