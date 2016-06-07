import {Injectable} from "angular2/core";
import {LegacyCode, Legacy} from "../../services/reference.service";
import {AppState} from "../../app.service";


export class ArchitectureModel {
  ntier:boolean;
  types:TypeModel[];
  layers: number = 0;
}

export class TypeModel {
  name:String;
  layer: LayerModel;
  legacy:Legacy;
}

export enum LayerModel
{
  ClientServer,
  Web,
  SOA,
  BinaryStream,
  Batch,
  Report
}

@Injectable()
/**
 * Architecture service.
 */
export class ArchitectureService {
  data: ArchitectureModel;

  constructor(private state:AppState) {
    this.data = this.state['architecture'];
  }

  public init() {
    console.log('Model state', this.data);
    if(!this.data) {
      console.log('Init data model...');
      this.data = new ArchitectureModel();
      this.data.ntier = false;
      this.state['architecture'] = this.data;
    }
    return this.data;
  }

}
